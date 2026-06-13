/**
 * services/endpoints.js
 * ──────────────────────
 * Single source of truth for backend route paths (relative to API_BASE_URL).
 * Keeping them centralized makes contract changes a one-line edit.
 */
export const ENDPOINTS = {
  auth: {
    register: "/auth/register",
    login: "/auth/login",
    refresh: "/auth/refresh",
  },
  users: {
    me: "/users/me",
    fcmToken: "/users/me/fcm-token",
  },
  rides: {
    compare: "/rides/compare",
    history: "/rides/history",
    historyById: (id) => `/rides/history/${id}`,
  },
  locations: {
    autocomplete: "/locations/autocomplete",
    geocode: "/locations/geocode",
    place: (placeId) => `/locations/place/${placeId}`,
  },
  analytics: {
    surgePredictions: "/analytics/surge-predictions",
    fareTrends: "/analytics/fare-trends",
    summary: "/analytics/summary",
  },
};

export default ENDPOINTS;
