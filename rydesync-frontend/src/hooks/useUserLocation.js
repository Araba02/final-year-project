import { useState, useEffect } from "react";
import * as Location from "expo-location";

// Default centre if permission is denied or location unavailable.
export const ACCRA = { lat: 5.6037, lng: -0.1870 };

/**
 * Requests foreground location permission and returns the device's current
 * GPS position. Falls back to the Accra city centre on error or denial.
 *
 * Returns { location: { lat, lng }, loading, error, isDefault }
 *   isDefault = true when the returned location is the Accra fallback, not the
 *   actual device position.
 */
export function useUserLocation() {
  const [location, setLocation]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          if (!cancelled) {
            setLocation(ACCRA);
            setIsDefault(true);
            setError("Location permission not granted — showing Accra.");
          }
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!cancelled) {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsDefault(false);
        }
      } catch (err) {
        if (!cancelled) {
          setLocation(ACCRA);
          setIsDefault(true);
          setError(err.message || "Could not get location.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { location, loading, error, isDefault };
}

export default useUserLocation;
