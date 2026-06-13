/**
 * utils/format.js
 * ────────────────
 * Presentation formatters shared across screens. Keeping these here means
 * money / distance / labels render consistently everywhere.
 */

const PLATFORM_LABELS = {
  uber: "Uber",
  bolt: "Bolt",
  yango: "Yango",
  shaxi: "Shaxi",
};

/** GHS currency, e.g. 24.5 → "GHS 24.50". */
export function formatCurrency(amount, currency = "GHS") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${currency} 0.00`;
  return `${currency} ${value.toFixed(2)}`;
}

/** e.g. 7.24 → "7.2 km". */
export function formatDistance(km) {
  const value = Number(km);
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(1)} km`;
}

/** e.g. 18 → "18 min". */
export function formatDuration(minutes) {
  const value = Number(minutes);
  if (!Number.isFinite(value)) return "—";
  return `${Math.round(value)} min`;
}

/** Title-case a platform id, e.g. "uber" → "Uber". */
export function platformLabel(platform) {
  if (!platform) return "";
  return PLATFORM_LABELS[platform] || platform.charAt(0).toUpperCase() + platform.slice(1);
}

/** Single-letter badge for a platform/label, e.g. "Bolt Economy" → "B". */
export function initial(text) {
  return (text || "?").trim().charAt(0).toUpperCase();
}

const PLATFORM_COLORS = {
  uber: "#b0b3c0",
  bolt: "#52e0c4",
  yango: "#f7c35f",
  shaxi: "#ff9ec7",
};

/** Accent color for a platform badge. */
export function platformColor(platform) {
  return PLATFORM_COLORS[platform] || "#ff9ec7";
}

/** Relative-ish date label, e.g. "Oct 24, 10:30 AM". */
export function formatDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default {
  formatCurrency,
  formatDistance,
  formatDuration,
  platformLabel,
  initial,
  formatDateTime,
};
