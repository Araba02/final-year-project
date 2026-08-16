/**
 * hooks/useRideCompareForm.js
 * ────────────────────────────
 * Shared pickup/destination state + compare submission used by the Home and
 * CompareRides screens. Resolves the user's preferred sort, calls the compare
 * endpoint, and navigates to RideMatch with the result.
 */
import { useState, useCallback } from "react";

import { ridesService } from "../services";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../navigation/routes";

export function useRideCompareForm() {
  const { user } = useAuth();
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  const submit = useCallback(
    async (navigation) => {
      setError(null);
      if (!origin || !destination) {
        setError("Set both your pickup and destination.");
        return;
      }
      setComparing(true);
      try {
        const sortBy = user?.preferredSort || "cost";
        const comparison = await ridesService.compare({ origin, destination, sortBy });
        navigation.navigate(ROUTES.RIDE_MATCH, { origin, destination, sortBy, comparison });
      } catch (err) {
        setError(err?.message || "Couldn't compare rides right now. Please try again.");
      } finally {
        setComparing(false);
      }
    },
    [origin, destination, user]
  );

  return { origin, destination, setOrigin, setDestination, comparing, error, submit };
}

export default useRideCompareForm;
