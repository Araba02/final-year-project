/**
 * utils/responsive.js
 * ────────────────────
 * Responsive sizing helpers (size-matters pattern).
 *
 * Every fixed pixel value in the design (font size, width, height, radius,
 * padding, margin, gap) is passed through one of these helpers so the UI
 * scales proportionally across phone / tablet / web instead of being locked
 * to a single device size.
 *
 * Calibration:
 *   The design was authored against a 390 × 844 logical viewport (a modern
 *   phone). On a device of that width, `ms(x) === x`, so the layout renders
 *   pixel-identical to the original. On narrower / wider devices everything
 *   scales gently and uniformly — the proportions (i.e. the layout) are
 *   preserved, only the absolute sizes adapt.
 *
 *   To avoid oversized text on tablets/web, the width used for scaling is
 *   clamped to MAX_SCALE_WIDTH; large screens instead get a centered,
 *   max-width content column (see ScreenWrap / useResponsive).
 */
import { Dimensions } from "react-native";

const GUIDELINE_BASE_WIDTH = 390;
const GUIDELINE_BASE_HEIGHT = 844;

// Cap the width that drives scaling so fonts/elements don't balloon on
// very wide viewports (tablets, desktop web).
export const MAX_SCALE_WIDTH = 430;

// Width of the centered content column on large screens.
export const MAX_CONTENT_WIDTH = 430;

const { width, height } = Dimensions.get("window");

const effectiveWidth = Math.min(width, MAX_SCALE_WIDTH);

/** Horizontal scale — based on screen width. */
export const scale = (size) => (effectiveWidth / GUIDELINE_BASE_WIDTH) * size;

/** Vertical scale — based on screen height. */
export const verticalScale = (size) =>
  (Math.min(height, GUIDELINE_BASE_HEIGHT * 1.2) / GUIDELINE_BASE_HEIGHT) * size;

/**
 * Moderate scale — scales gently with a damping factor (default 0.5).
 * Best for font sizes, radii and most spacing where full scaling would be
 * too aggressive.
 */
export const moderateScale = (size, factor = 0.5) =>
  size + (scale(size) - size) * factor;

// Short aliases used throughout the stylesheets.
export const s = scale;
export const vs = verticalScale;
export const ms = moderateScale;

export default { scale, verticalScale, moderateScale, s, vs, ms };
