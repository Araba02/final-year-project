/**
 * theme/commonStyles.js
 * ──────────────────────
 * Reusable style primitives shared across multiple screens (cards, inputs,
 * list rows, chips, toggles, etc.). Screens import only what they need and
 * add their own screen-specific styles locally.
 *
 * All dimensional values are passed through `ms()` (moderate scale) so they
 * adapt across device sizes while preserving the original proportions.
 */
import { StyleSheet } from "react-native";

import { COLORS } from "./colors";
import { ms } from "../utils/responsive";

export const commonStyles = StyleSheet.create({
  // ── Typography ────────────────────────────────────────────────────────────
  sectionTitle: {
    fontSize: ms(20),
    fontWeight: "600",
    color: "#fff",
  },
  sectionSubtitle: {
    fontSize: ms(12),
    color: "rgba(255,255,255,0.6)",
    marginTop: ms(6),
  },
  sectionTitleSmall: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: ms(10),
    letterSpacing: ms(2),
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
  listTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: ms(12),
    fontWeight: "600",
  },
  smallText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(11),
  },
  smallLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(9),
  },
  linkText: {
    color: COLORS.fuchsia,
    fontSize: ms(12),
    textAlign: "right",
  },
  priceText: {
    color: COLORS.fuchsia,
    fontSize: ms(14),
    fontWeight: "700",
  },
  backArrow: {
    color: "rgba(255,255,255,0.8)",
    fontSize: ms(14),
  },
  homeGreeting: {
    fontSize: ms(22),
    fontWeight: "600",
    color: "#fff",
  },

  // ── Containers ────────────────────────────────────────────────────────────
  card: {
    borderRadius: ms(24),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: ms(16),
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: ms(16),
  },
  centeredRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowBetweenSmall: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: ms(8),
  },
  rowCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
  },

  // ── Inputs ────────────────────────────────────────────────────────────────
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: ms(18),
    paddingHorizontal: ms(16),
    paddingVertical: ms(12),
    fontSize: ms(14),
    color: "#fff",
  },
  inputPill: {
    marginTop: ms(8),
    borderRadius: ms(999),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingVertical: ms(10),
    paddingHorizontal: ms(12),
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
  },
  pillIcon: {
    width: ms(30),
    height: ms(30),
    borderRadius: ms(15),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pillIconText: {
    color: "#ffb6d7",
    fontSize: ms(16),
  },
  pillText: {
    color: "#fff",
    fontSize: ms(12),
  },

  // ── Divider / social ──────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  dividerText: {
    fontSize: ms(11),
    color: "rgba(255,255,255,0.5)",
  },
  socialRow: {
    flexDirection: "row",
    gap: ms(10),
  },

  // ── Map preview ───────────────────────────────────────────────────────────
  mapCard: {
    height: ms(170),
    borderRadius: ms(20),
    overflow: "hidden",
    position: "relative",
  },
  mapImage: {
    width: "100%",
    height: "100%",
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,79,154,0.15)",
  },

  // ── List rows ─────────────────────────────────────────────────────────────
  listCard: {
    borderRadius: ms(22),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: ms(14),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
  },
  listIcon: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  listItemTitle: {
    fontSize: ms(14),
    fontWeight: "600",
    color: "#fff",
  },
  listItemMeta: {
    fontSize: ms(10),
    color: "rgba(255,255,255,0.5)",
  },
  listArrow: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(14),
  },

  // ── Chips ─────────────────────────────────────────────────────────────────
  chipActive: {
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(999),
    backgroundColor: COLORS.fuchsiaSoft,
  },
  chipActiveText: {
    color: "#ffb6d7",
    fontSize: ms(10),
    fontWeight: "600",
  },
  chip: {
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(999),
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  chipText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: ms(10),
  },

  // ── Driver row (RideMatch / RideDetails) ─────────────────────────────────
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
  },
  driverAvatar: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  driverName: {
    color: "#fff",
    fontSize: ms(10),
    fontWeight: "600",
  },
  driverMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(9),
  },

  // ── Toggles (Profile / EditProfile) ──────────────────────────────────────
  prefIcon: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleOn: {
    width: ms(40),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: "rgba(255,79,154,0.7)",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingHorizontal: ms(3),
  },
  toggleKnob: {
    width: ms(14),
    height: ms(14),
    borderRadius: ms(7),
    backgroundColor: "#fff",
  },
  toggleOff: {
    width: ms(40),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: ms(3),
  },
  toggleKnobOff: {
    width: ms(14),
    height: ms(14),
    borderRadius: ms(7),
    backgroundColor: "rgba(255,255,255,0.7)",
  },

  // ── Profile avatar (Profile / EditProfile) ───────────────────────────────
  profileAvatar: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(40),
    backgroundColor: "rgba(255,255,255,0.1)",
  },
});

export default commonStyles;
