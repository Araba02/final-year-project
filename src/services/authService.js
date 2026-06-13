/**
 * services/authService.js
 * ────────────────────────
 * Authentication + current-user operations.
 *
 * Note: the backend's /auth/login is an OAuth2 password flow, so it expects
 * `application/x-www-form-urlencoded` with `username` (= email) + `password`,
 * not JSON.
 */
import { httpClient, setAuthTokens } from "./httpClient";
import { ENDPOINTS } from "./endpoints";
import { tokenStorage } from "./storage";

/** @typedef {{ id:string, email:string, fullName:string, preferredSort:string, isActive:boolean, isVerified:boolean, createdAt:string, lastLoginAt:string|null }} User */

/** Map a backend UserResponse → app User. */
export function mapUser(dto) {
  if (!dto) return null;
  return {
    id: dto.id,
    email: dto.email,
    fullName: dto.full_name,
    preferredSort: dto.preferred_sort,
    isActive: dto.is_active,
    isVerified: dto.is_verified,
    createdAt: dto.created_at,
    lastLoginAt: dto.last_login_at ?? null,
  };
}

async function persistTokens(data) {
  const tokens = { accessToken: data.access_token, refreshToken: data.refresh_token };
  setAuthTokens(tokens);
  await tokenStorage.setTokens(tokens);
  return tokens;
}

export const authService = {
  /** Create an account. Returns the created User (not authenticated yet). */
  async register({ fullName, email, password, preferredSort = "cost" }) {
    const { data } = await httpClient.post(ENDPOINTS.auth.register, {
      full_name: fullName,
      email,
      password,
      preferred_sort: preferredSort,
    });
    return mapUser(data);
  },

  /** Authenticate and persist tokens. Returns the tokens. */
  async login({ email, password }) {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    const { data } = await httpClient.post(ENDPOINTS.auth.login, form.toString(), {
      skipAuth: true,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    return persistTokens(data);
  },

  /** Fetch the authenticated user's profile. */
  async getCurrentUser() {
    const { data } = await httpClient.get(ENDPOINTS.users.me);
    return mapUser(data);
  },

  /** Patch the authenticated user's profile. */
  async updateProfile({ fullName, preferredSort, password }) {
    const payload = {};
    if (fullName !== undefined) payload.full_name = fullName;
    if (preferredSort !== undefined) payload.preferred_sort = preferredSort;
    if (password) payload.password = password;
    const { data } = await httpClient.patch(ENDPOINTS.users.me, payload);
    return mapUser(data);
  },

  /** Register the device FCM token for push notifications (best-effort). */
  async registerFcmToken(token) {
    await httpClient.post(ENDPOINTS.users.fcmToken, { token });
  },

  /** Clear persisted tokens and in-memory auth. */
  async logout() {
    setAuthTokens(null);
    await tokenStorage.clear();
  },
};

export default authService;
