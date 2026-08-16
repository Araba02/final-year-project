/**
 * utils/useResponsive.js
 * ───────────────────────
 * Hook exposing live window dimensions and derived responsive flags.
 * Unlike the static helpers in responsive.js, this re-renders on rotation
 * and window-resize (web), which is what container-level layout needs.
 */
import { useWindowDimensions } from "react-native";

import { MAX_CONTENT_WIDTH } from "./responsive";

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isLargeScreen = width >= 600; // tablets / desktop web

  return {
    width,
    height,
    isLandscape,
    isLargeScreen,
    // Content never grows wider than the design column; large screens center it.
    contentWidth: Math.min(width, MAX_CONTENT_WIDTH),
  };
}

export default useResponsive;
