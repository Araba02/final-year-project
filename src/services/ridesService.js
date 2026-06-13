/**
 * services/ridesService.js
 * ─────────────────────────
 * Ride comparison + history. Maps backend snake_case DTOs into camelCase
 * domain objects with a few precomputed display helpers.
 */
import { httpClient } from "./httpClient";
import { ENDPOINTS } from "./endpoints";
import { formatCurrency, platformLabel } from "../utils/format";

/** @typedef {{ id:string, platform:string, platformLabel:string, rideCategory:string, fareEstimate:number, fareMin:number, fareMax:number, priceLabel:string, eta:number, driverRating:number, driversNearby:number, isSurge:boolean, surgeMultiplier:number, deepLinkUrl:string, roadDistanceKm:number|null, roadDurationMin:number|null }} RideOption */

export function mapRideOption(dto) {
  return {
    id: dto.id,
    platform: dto.platform,
    platformLabel: platformLabel(dto.platform),
    rideCategory: dto.ride_category,
    fareEstimate: dto.fare_estimate_ghs,
    fareMin: dto.fare_min_ghs,
    fareMax: dto.fare_max_ghs,
    priceLabel: formatCurrency(dto.fare_estimate_ghs),
    eta: dto.eta_minutes,
    driverRating: dto.driver_rating,
    driversNearby: dto.drivers_nearby,
    isSurge: dto.is_surge,
    surgeMultiplier: dto.surge_multiplier,
    deepLinkUrl: dto.deep_link_url,
    roadDistanceKm: dto.road_distance_km ?? null,
    roadDurationMin: dto.road_duration_min ?? null,
  };
}

export function mapComparison(dto) {
  const options = (dto.ride_options || []).map(mapRideOption);
  return {
    id: dto.id,
    originAddress: dto.origin_address,
    destinationAddress: dto.destination_address,
    isSurgeDetected: dto.is_surge_detected,
    surgeWarning: dto.surge_warning ?? null,
    createdAt: dto.created_at,
    routeDistanceKm: dto.route_distance_km ?? null,
    routeDurationMin: dto.route_duration_min ?? null,
    options,
    recommendation: dto.recommendation ? mapRideOption(dto.recommendation) : options[0] || null,
  };
}

export const ridesService = {
  /**
   * Compare ride options across platforms.
   * @param {{ origin:{address,lat,lng}, destination:{address,lat,lng}, sortBy?:('cost'|'time'|'rating'), platforms?:string[] }} params
   */
  async compare({ origin, destination, sortBy = "cost", platforms }) {
    const payload = {
      origin: { address: origin.address, lat: origin.lat, lng: origin.lng },
      destination: { address: destination.address, lat: destination.lat, lng: destination.lng },
      sort_by: sortBy,
    };
    if (platforms?.length) payload.platforms = platforms;
    const { data } = await httpClient.post(ENDPOINTS.rides.compare, payload);
    return mapComparison(data);
  },

  /** Paginated comparison history for the authenticated user. */
  async getHistory({ limit = 20, offset = 0 } = {}) {
    const { data } = await httpClient.get(ENDPOINTS.rides.history, {
      params: { limit, offset },
    });
    return (data || []).map(mapComparison);
  },

  /** A single past comparison by id. */
  async getComparison(id) {
    const { data } = await httpClient.get(ENDPOINTS.rides.historyById(id));
    return mapComparison(data);
  },
};

export default ridesService;
