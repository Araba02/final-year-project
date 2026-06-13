/**
 * components/hero/styles.js
 * ──────────────────────────
 * Shared stylesheet for the three onboarding hero illustrations
 * (Compare / Favorites / Insights).
 */
import { StyleSheet } from "react-native";

import { COLORS } from "../../theme/colors";
import { ms } from "../../utils/responsive";

export const heroStyles = StyleSheet.create({
  // ── Shared frame ──────────────────────────────────────────────────────────
  heroWrap: {
    width: ms(240),
    height: ms(240),
    alignItems: "center",
    justifyContent: "center",
  },
  heroShadow: {
    position: "absolute",
    width: ms(240),
    height: ms(240),
    borderRadius: ms(36),
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    backgroundColor: "rgba(255,79,154,0.35)",
    transform: [{ translateX: ms(6) }, { translateY: ms(10) }, { rotate: "5deg" }],
    opacity: 0.6,
  },
  heroRotate: {
    width: ms(240),
    height: ms(240),
    transform: [{ rotate: "-7.5deg" }],
  },
  heroCard: {
    flex: 1,
    borderRadius: ms(36),
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    backgroundColor: "rgba(42,15,28,0.35)",
  },

  // ── Compare hero ──────────────────────────────────────────────────────────
  heroMapInset: {
    position: "absolute",
    top: ms(12),
    left: ms(12),
    right: ms(12),
    bottom: ms(12),
    borderRadius: ms(28),
    overflow: "hidden",
    backgroundColor: "rgba(58,20,38,0.7)",
  },
  heroMapImage: {
    width: "100%",
    height: "100%",
    opacity: 0.7,
  },
  heroMapTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,79,154,0.15)",
  },
  heroPinOuter: {
    position: "absolute",
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: "rgba(255,79,154,0.3)",
    top: "42%",
    left: "50%",
    marginLeft: ms(-10),
  },
  heroPinInner: {
    position: "absolute",
    width: ms(14),
    height: ms(14),
    borderRadius: ms(7),
    backgroundColor: COLORS.fuchsia,
    top: "39%",
    left: "50%",
    marginLeft: ms(-7),
  },
  heroPinRing: {
    position: "absolute",
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    borderWidth: 2,
    borderColor: "rgba(255,79,154,0.7)",
    top: "37%",
    left: "50%",
    marginLeft: ms(-10),
  },
  heroPricePill: {
    position: "absolute",
    left: "50%",
    bottom: ms(24),
    transform: [{ translateX: ms(-88) }],
    width: ms(176),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ms(12),
    paddingVertical: ms(8),
    borderRadius: ms(999),
    borderWidth: 1,
    borderColor: "rgba(255,79,154,0.3)",
    backgroundColor: "rgba(42,15,28,0.7)",
  },
  heroPriceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
  },
  heroCarBadge: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(13),
    backgroundColor: "rgba(255,79,154,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroPriceLine: {
    width: ms(32),
    height: ms(6),
    borderRadius: ms(4),
    backgroundColor: "rgba(255,79,154,0.5)",
  },
  heroPriceText: {
    color: "#ffd2e7",
    fontSize: ms(10),
    fontWeight: "600",
  },

  // ── Favorites hero ────────────────────────────────────────────────────────
  heroFavoritesPin: {
    position: "absolute",
    top: ms(32),
    left: "50%",
    marginLeft: ms(-16),
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: "rgba(255,79,154,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroFavRow: {
    position: "absolute",
    top: ms(110),
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: ms(18),
  },
  heroFavItem: {
    alignItems: "center",
    gap: ms(4),
  },
  heroFavIcon: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: "rgba(255,79,154,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroFavLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: ms(10),
  },
  heroFavMeta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(9),
  },

  // ── Insights hero ─────────────────────────────────────────────────────────
  heroInsightsCard: {
    padding: ms(18),
  },
  heroInsightsHeader: {
    marginTop: ms(20),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  heroInsightsLabel: {
    color: "#ffb6d7",
    fontSize: ms(8),
    letterSpacing: ms(2),
    fontWeight: "600",
  },
  heroInsightsValue: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "700",
    marginTop: ms(4),
  },
  heroInsightsMeta: {
    color: "#6ee7b7",
    fontSize: ms(9),
  },
  heroInsightsIcon: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: "rgba(255,79,154,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroSmartCard: {
    position: "absolute",
    left: ms(-18),
    top: ms(110),
    width: ms(276),
    borderRadius: ms(26),
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    backgroundColor: "rgba(42,15,28,0.55)",
    paddingVertical: ms(12),
    paddingHorizontal: ms(12),
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
  },
  heroStars: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center",
  },
  heroSmartText: {
    flex: 1,
    paddingLeft: ms(6),
  },
  heroSmartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroSmartTitle: {
    color: "#fff",
    fontSize: ms(10),
    fontWeight: "600",
  },
  heroSmartArrow: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(12),
  },
  heroSmartMeta: {
    color: "rgba(255,255,255,0.6)",
    fontSize: ms(9),
    marginTop: ms(4),
  },
  heroInsightsPin: {
    position: "absolute",
    bottom: ms(22),
    right: ms(22),
    width: ms(28),
    height: ms(28),
    borderRadius: ms(14),
    backgroundColor: "rgba(255,79,154,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default heroStyles;
