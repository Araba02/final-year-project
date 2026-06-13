/**
 * context/AuthContext.js
 * ───────────────────────
 * App-wide authentication state machine.
 *
 * status: "bootstrapping" → "authenticated" | "unauthenticated"
 *   - bootstrapping: reading persisted tokens on launch
 *   - authenticated: valid session, `user` populated
 *   - unauthenticated: no/invalid session
 *
 * Exposes login / register / logout / refreshUser. A failed token refresh in
 * the HTTP layer calls back here to force-logout.
 */
import React, { createContext, useContext, useEffect, useMemo, useReducer, useCallback } from "react";

import {
  authService,
  setAuthTokens,
  setOnUnauthorized,
  tokenStorage,
} from "../services";

const AuthContext = createContext(null);

const initialState = {
  status: "bootstrapping",
  user: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "AUTHENTICATED":
      return { status: "authenticated", user: action.user };
    case "UNAUTHENTICATED":
      return { status: "unauthenticated", user: null };
    case "USER_UPDATED":
      return { ...state, user: action.user };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Restore a persisted session on launch.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const tokens = await tokenStorage.getTokens();
        if (!tokens.accessToken) {
          if (!cancelled) dispatch({ type: "UNAUTHENTICATED" });
          return;
        }
        setAuthTokens(tokens);
        const user = await authService.getCurrentUser();
        if (!cancelled) dispatch({ type: "AUTHENTICATED", user });
      } catch {
        await authService.logout();
        if (!cancelled) dispatch({ type: "UNAUTHENTICATED" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Force logout when the HTTP layer can't refresh.
  useEffect(() => {
    setOnUnauthorized(() => dispatch({ type: "UNAUTHENTICATED" }));
    return () => setOnUnauthorized(null);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    await authService.login({ email, password });
    const user = await authService.getCurrentUser();
    dispatch({ type: "AUTHENTICATED", user });
    return user;
  }, []);

  const register = useCallback(async ({ fullName, email, password, preferredSort }) => {
    await authService.register({ fullName, email, password, preferredSort });
    return login({ email, password });
  }, [login]);

  const logout = useCallback(async () => {
    await authService.logout();
    dispatch({ type: "UNAUTHENTICATED" });
  }, []);

  const refreshUser = useCallback(async () => {
    const user = await authService.getCurrentUser();
    dispatch({ type: "USER_UPDATED", user });
    return user;
  }, []);

  const setUser = useCallback((user) => dispatch({ type: "USER_UPDATED", user }), []);

  const value = useMemo(
    () => ({
      ...state,
      isAuthenticated: state.status === "authenticated",
      isBootstrapping: state.status === "bootstrapping",
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [state, login, register, logout, refreshUser, setUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

export default AuthContext;
