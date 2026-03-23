"""
app/services/recommendation_engine.py
───────────────────────────────────────
Recommendation Engine — ranks ride options by user-defined criteria.

Algorithm:
    1. Normalise each metric (fare, eta, rating) to [0, 1] range.
    2. Assign weights based on the selected SortCriteria.
    3. Compute a weighted composite score (lower is better).
    4. Return the ride option with the lowest composite score as the
       top recommendation; return the full ranked list for the dashboard.

This is a transparent, explainable scoring model appropriate for an
academic FYP — no black-box ML needed here.
"""
from __future__ import annotations

from typing import List, Tuple

from app.core.logging import get_logger
from app.schemas.ride import RideOptionResponse, SortCriteria

logger = get_logger(__name__)


# Weight profiles — (fare_weight, eta_weight, rating_weight)
_WEIGHT_PROFILES: dict[SortCriteria, Tuple[float, float, float]] = {
    SortCriteria.COST:   (0.70, 0.20, 0.10),
    SortCriteria.TIME:   (0.15, 0.70, 0.15),
    SortCriteria.RATING: (0.15, 0.15, 0.70),
}


def _normalise(values: List[float], invert: bool = False) -> List[float]:
    """
    Min-max normalisation.
    If invert=True, higher original values become lower scores
    (used for driver_rating where higher is better).
    """
    lo, hi = min(values), max(values)
    if hi == lo:
        return [0.5] * len(values)
    normed = [(v - lo) / (hi - lo) for v in values]
    return [1.0 - n for n in normed] if invert else normed


def rank_rides(
    options: List[RideOptionResponse],
    sort_by: SortCriteria = SortCriteria.COST,
) -> Tuple[List[RideOptionResponse], RideOptionResponse]:
    """
    Rank a list of RideOptionResponse objects.

    Returns:
        ranked_list: All options sorted best → worst.
        recommendation: The single best option.
    """
    if not options:
        raise ValueError("Cannot rank an empty list of ride options.")

    fare_w, eta_w, rating_w = _WEIGHT_PROFILES[sort_by]

    fares   = [o.fare_estimate_ghs for o in options]
    etas    = [o.eta_minutes for o in options]
    ratings = [o.driver_rating for o in options]

    norm_fares   = _normalise(fares,   invert=False)
    norm_etas    = _normalise(etas,    invert=False)
    norm_ratings = _normalise(ratings, invert=True)   # higher rating → lower score

    scores = [
        fare_w * nf + eta_w * ne + rating_w * nr
        for nf, ne, nr in zip(norm_fares, norm_etas, norm_ratings)
    ]

    ranked_pairs = sorted(zip(scores, options), key=lambda x: x[0])
    ranked_list  = [opt for _, opt in ranked_pairs]
    recommendation = ranked_list[0]

    logger.debug(
        "Ride options ranked",
        sort_by=sort_by.value,
        count=len(options),
        top_pick=f"{recommendation.platform}/{recommendation.ride_category}",
        top_fare=recommendation.fare_estimate_ghs,
    )

    return ranked_list, recommendation
