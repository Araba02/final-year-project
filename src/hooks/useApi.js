/**
 * hooks/useApi.js
 * ────────────────
 * Declarative data-fetching hook for read endpoints.
 *
 *   const { data, loading, error, refetch } = useApi(
 *     () => ridesService.getHistory(), []
 *   );
 *
 * Handles the loading/error/empty lifecycle and ignores stale responses when
 * the component unmounts or deps change mid-flight.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export function useApi(asyncFn, deps = [], { immediate = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mounted = useRef(true);
  const reqId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      if (mounted.current && id === reqId.current) setData(result);
      return result;
    } catch (err) {
      if (mounted.current && id === reqId.current) setError(err);
      throw err;
    } finally {
      if (mounted.current && id === reqId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) run().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, refetch: run, setData };
}

export default useApi;
