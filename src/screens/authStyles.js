/**
 * screens/authStyles.js
 * ──────────────────────
 * Shared styles for the auth screens (Login / Signup): inline error banner
 * and the submitting indicator container.
 */
import { StyleSheet } from "react-native";

import { COLORS } from "../theme/colors";
import { ms } from "../utils/responsive";

export const authStyles = StyleSheet.create({
  errorBanner: {
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    backgroundColor: COLORS.fuchsiaSoft,
    paddingHorizontal: ms(14),
    paddingVertical: ms(10),
  },
  errorText: {
    color: "#ffd2e7",
    fontSize: ms(11),
  },
  submitting: {
    height: ms(44),
    borderRadius: ms(999),
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default authStyles;
