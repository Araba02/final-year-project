/**
 * config/env.js
 * ──────────────
 * Runtime environment resolution for the API layer.
 *
 * Base-URL precedence (first match wins):
 *   1. process.env.EXPO_PUBLIC_API_URL        — explicit override (CI / prod)
 *   2. app.json → expo.extra.apiBaseUrl        — committed override
 *   3. Auto-detected LAN host from the Expo dev server + DEFAULT_API_PORT
 *      (so it "just works" on a physical device / emulator on the same network)
 *   4. http://localhost:<port>                 — last-resort fallback
 *
 * The auto-detection reads the Metro/Expo host (e.g. "192.168.1.20:8081") and
 * swaps in the backend port — no manual IP juggling between machines.
 */
import { Platform } from "react-native";
import Constants from "expo-constants";

const DEFAULT_API_PORT = 8000;
const API_PREFIX = "/api/v1";

const extra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};

/** Extract the dev machine host (IP only) from whatever Expo exposes. */
function getDevHost() {
  const candidate =
    Constants?.expoConfig?.hostUri ||
    Constants?.expoGoConfig?.debuggerHost ||
    Constants?.manifest2?.extra?.expoClient?.hostUri ||
    Constants?.manifest?.debuggerHost ||
    "";
  const host = String(candidate).split(":")[0];
  return host || null;
}

function resolveBaseUrl() {
  const explicit = process.env.EXPO_PUBLIC_API_URL || extra.apiBaseUrl;
  if (explicit) return stripTrailingSlash(explicit);

  // Android emulator cannot reach the host via "localhost"; it uses 10.0.2.2.
  const fallbackHost =
    getDevHost() || (Platform.OS === "android" ? "10.0.2.2" : "localhost");

  return `http://${fallbackHost}:${DEFAULT_API_PORT}${API_PREFIX}`;
}

function stripTrailingSlash(url) {
  const base = url.replace(/\/+$/, "");
  // Allow overrides to omit the version prefix.
  return base.endsWith(API_PREFIX) ? base : `${base}${API_PREFIX}`;
}

export const ENV = {
  /** Fully-qualified API base, e.g. http://192.168.1.20:8000/api/v1 */
  API_BASE_URL: resolveBaseUrl(),
  /** Derived WebSocket origin, e.g. ws://192.168.1.20:8000/api/v1 */
  get WS_BASE_URL() {
    return this.API_BASE_URL.replace(/^http/i, "ws");
  },
  /** Mobile API key (only enforced by the backend outside development). */
  API_KEY: process.env.EXPO_PUBLIC_API_KEY || extra.apiKey || null,
  /** Network timeout in milliseconds. */
  REQUEST_TIMEOUT_MS: Number(extra.requestTimeoutMs) || 15000,
  IS_DEV: __DEV__,
};

export default ENV;
