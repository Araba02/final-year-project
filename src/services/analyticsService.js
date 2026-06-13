/**
 * services/analyticsService.js
 * ─────────────────────────────
 * Predictive analytics + fare trends + per-user summary.
 */
import { httpClient } from "./httpClient";
import { ENDPOINTS } from "./endpoints";
import { platformLabel } from "../utils/format";

function mapSurgePrediction(dto) {
  return {
    platform: dto.platform,
    platformLabel: platformLabel(dto.platform),
    hour: dto.predicted_hour,
    dayOfWeek: dto.predicted_day_of_week,
    probability: dto.surge_probability,
    riskLevel: dto.risk_level,
  };
}

function mapFareTrendPoint(dto) {
  return {
    date: dto.date,
    platform: dto.platform,
    platformLabel: platformLabel(dto.platform),
    avgFare: dto.avg_fare_ghs,
    comparisonCount: dto.comparison_count,
  };
}

export const analyticsService = {
  /** 24h surge forecast, optionally filtered by platform. */
  async getSurgePredictions({ platform } = {}) {
    const { data } = await httpClient.get(ENDPOINTS.analytics.surgePredictions, {
      params: platform ? { platform } : undefined,
      skipAuth: true,
    });
    return (data || []).map(mapSurgePrediction);
  },

  /** Daily average fares per platform over a lookback window. */
  async getFareTrends({ days = 30, platforms } = {}) {
    const { data } = await httpClient.get(ENDPOINTS.analytics.fareTrends, {
      params: { days, platforms: platforms?.length ? platforms.join(",") : undefined },
      skipAuth: true,
    });
    return {
      points: (data?.points || []).map(mapFareTrendPoint),
      dateRangeDays: data?.date_range_days ?? days,
      platforms: data?.platforms ?? [],
    };
  },

  /** Personalized summary for the authenticated user. */
  async getSummary({ days = 30 } = {}) {
    const { data } = await httpClient.get(ENDPOINTS.analytics.summary, {
      params: { days },
    });
    return {
      totalComparisons: data.total_comparisons,
      averageFare: data.average_fare_ghs,
      surgeFrequencyPct: data.surge_frequency_pct,
      mostUsedPlatform: data.most_used_platform,
      dateRangeDays: data.date_range_days,
    };
  },
};

export default analyticsService;
