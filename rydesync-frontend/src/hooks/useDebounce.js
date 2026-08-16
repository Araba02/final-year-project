/**
 * hooks/useDebounce.js
 * ─────────────────────
 * Returns a debounced copy of a fast-changing value (e.g. a search query)
 * so we don't fire an API call on every keystroke.
 */
import { useEffect, useState } from "react";

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export default useDebounce;
