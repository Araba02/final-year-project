/**
 * services/locationsService.js
 * ─────────────────────────────
 * Google-Maps-backed location lookups (autocomplete, geocode, place details).
 * Autocomplete + place details share a session token to bill as one session.
 */
import { httpClient } from "./httpClient";
import { ENDPOINTS } from "./endpoints";

function mapSuggestion(dto) {
  return {
    placeId: dto.place_id,
    description: dto.description,
    mainText: dto.main_text,
    secondaryText: dto.secondary_text,
  };
}

function mapGeocode(dto) {
  return {
    address: dto.formatted_address,
    lat: dto.lat,
    lng: dto.lng,
    placeId: dto.place_id,
  };
}

export const locationsService = {
  /** Up to 5 Ghana-restricted place suggestions for a partial query. */
  async autocomplete(query, { sessionToken } = {}) {
    const { data } = await httpClient.get(ENDPOINTS.locations.autocomplete, {
      params: { q: query, session_token: sessionToken },
      skipAuth: true,
    });
    return (data || []).map(mapSuggestion);
  },

  /** Resolve free-text address → coordinates. */
  async geocode(address) {
    const { data } = await httpClient.get(ENDPOINTS.locations.geocode, {
      params: { address },
      skipAuth: true,
    });
    return mapGeocode(data);
  },

  /** Resolve a place_id (from autocomplete) → coordinates. */
  async placeDetails(placeId) {
    const { data } = await httpClient.get(ENDPOINTS.locations.place(placeId), {
      skipAuth: true,
    });
    return mapGeocode(data);
  },
};

export default locationsService;
