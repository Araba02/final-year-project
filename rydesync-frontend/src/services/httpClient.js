/**
 * services/httpClient.js
 * ───────────────────────
 * Configured axios instance with:
 *   - Bearer auth + optional X-API-Key injection
 *   - Transparent access-token refresh on 401 (single-flight; concurrent
 *     requests queue behind one refresh call, then replay)
 *   - Normalized ApiError rejections
 *
 * The token lifecycle is owned here so screens/services never touch storage
 * directly. AuthContext registers an `onUnauthorized` handler so a failed
 * refresh cleanly logs the user out.
 */
import axios from "axios";

import { ENV } from "../config/env";
import { ENDPOINTS } from "./endpoints";
import { ApiError } from "./ApiError";
import { tokenStorage } from "./storage";

// In-memory mirror of the access token for synchronous request decoration.
let accessToken = null;
let refreshToken = null;
let onUnauthorized = null;

export function setAuthTokens(tokens) {
  accessToken = tokens?.accessToken ?? null;
  refreshToken = tokens?.refreshToken ?? null;
}

export function setOnUnauthorized(handler) {
  onUnauthorized = handler;
}

export const httpClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.REQUEST_TIMEOUT_MS,
  headers: { Accept: "application/json" },
});

// ── Request: attach auth headers ──────────────────────────────────────────────
httpClient.interceptors.request.use((config) => {
  if (accessToken && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (ENV.API_KEY) {
    config.headers["X-API-Key"] = ENV.API_KEY;
  }
  return config;
});

// ── Response: refresh-on-401 + error normalization ───────────────────────────
let refreshPromise = null;

async function performRefresh() {
  if (!refreshToken) throw new Error("No refresh token");
  // Bare call (skipAuth) so we don't loop through this interceptor.
  const { data } = await httpClient.post(
    ENDPOINTS.auth.refresh,
    { refresh_token: refreshToken },
    { skipAuth: true, _isRefresh: true }
  );
  const tokens = { accessToken: data.access_token, refreshToken: data.refresh_token };
  setAuthTokens(tokens);
  await tokenStorage.setTokens(tokens);
  return tokens.accessToken;
}

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    const status = error.response?.status;

    const canRetry =
      status === 401 && refreshToken && !original._retry && !original._isRefresh && !original.skipAuth;

    if (canRetry) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise || performRefresh();
        const newToken = await refreshPromise;
        refreshPromise = null;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return httpClient(original);
      } catch (refreshErr) {
        refreshPromise = null;
        setAuthTokens(null);
        await tokenStorage.clear();
        if (onUnauthorized) onUnauthorized();
        return Promise.reject(ApiError.fromAxios(error));
      }
    }

    return Promise.reject(ApiError.fromAxios(error));
  }
);

export default httpClient;
