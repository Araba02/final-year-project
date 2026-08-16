/**
 * services/storage.js
 * ────────────────────
 * Secure persistence for auth tokens via expo-secure-store (Keychain /
 * Keystore on device). On web — where SecureStore is unavailable — it falls
 * back to localStorage, and finally to an in-memory map, so the same API
 * works everywhere without throwing.
 */
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const KEYS = {
  ACCESS_TOKEN: "ridesync.accessToken",
  REFRESH_TOKEN: "ridesync.refreshToken",
};

const memoryStore = new Map();

const isWeb = Platform.OS === "web";
const hasLocalStorage =
  typeof globalThis !== "undefined" && typeof globalThis.localStorage !== "undefined";

async function setItem(key, value) {
  if (value == null) return removeItem(key);
  if (isWeb) {
    if (hasLocalStorage) globalThis.localStorage.setItem(key, value);
    else memoryStore.set(key, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

async function getItem(key) {
  if (isWeb) {
    if (hasLocalStorage) return globalThis.localStorage.getItem(key);
    return memoryStore.get(key) ?? null;
  }
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

async function removeItem(key) {
  memoryStore.delete(key);
  if (isWeb) {
    if (hasLocalStorage) globalThis.localStorage.removeItem(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* already cleared from memory above */
  }
}

export const tokenStorage = {
  async getTokens() {
    const [accessToken, refreshToken] = await Promise.all([
      getItem(KEYS.ACCESS_TOKEN),
      getItem(KEYS.REFRESH_TOKEN),
    ]);
    return { accessToken, refreshToken };
  },
  async setTokens({ accessToken, refreshToken }) {
    await Promise.all([
      setItem(KEYS.ACCESS_TOKEN, accessToken),
      setItem(KEYS.REFRESH_TOKEN, refreshToken),
    ]);
  },
  async clear() {
    await Promise.all([removeItem(KEYS.ACCESS_TOKEN), removeItem(KEYS.REFRESH_TOKEN)]);
  },
};

export default tokenStorage;
