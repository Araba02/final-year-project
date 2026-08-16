import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenWrap, BottomNav } from "../components/layout";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { LoadingState, ErrorState, EmptyState } from "../components/feedback";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { formatCurrency, formatDistance, formatDateTime, platformLabel } from "../utils/format";
import { ridesService } from "../services";
import { useApi } from "../hooks";
import { ROUTES } from "../navigation/routes";

const PLATFORM_COLORS = ["#34d399", COLORS.fuchsia, "#fbbf24"];

function summarize(comparison) {
  const fares = comparison.options.map((o) => o.fareEstimate).filter(Number.isFinite);
  const bestPrice = fares.length ? Math.min(...fares) : null;
  const platforms = [...new Set(comparison.options.map((o) => o.platform))];
  const cheapest = comparison.options.reduce(
    (best, o) => (!best || o.fareEstimate < best.fareEstimate ? o : best),
    null
  );
  return { bestPrice, platforms, cheapest };
}

export const HistoryScreen = ({ navigation }) => {
  const { data, loading, error, refetch } = useApi(
    () => ridesService.getHistory({ limit: 30 }),
    []
  );

  return (
    <ScreenWrap footer={<BottomNav navigation={navigation} active="history" />}>
      <View style={{ gap: ms(20) }}>

        {/* ── Header ── */}
        <View style={commonStyles.rowBetween}>
          <View style={commonStyles.rowCenter}>
            <Pressable
              onPress={() => navigation.canGoBack() && navigation.goBack()}
              hitSlop={12}
            >
              <Feather name="chevron-left" size={ms(22)} color="rgba(255,255,255,0.8)" />
            </Pressable>
            <Text style={styles.screenTitle}>History</Text>
          </View>
          <View style={styles.filterPill}>
            <Feather name="calendar" size={ms(11)} color="rgba(255,255,255,0.5)" />
            <Text style={styles.filterText}>Last 30 Days</Text>
          </View>
        </View>

        {loading ? <LoadingState label="Loading your history…" /> : null}
        {!loading && error ? <ErrorState message={error.message} onRetry={refetch} /> : null}
        {!loading && !error && data?.length === 0 ? (
          <EmptyState
            icon="clock"
            title="No trips yet"
            message="Your ride comparisons will appear here."
          />
        ) : null}

        {!loading && !error && data?.map((comparison) => {
          const { bestPrice, platforms, cheapest } = summarize(comparison);
          return (
            <View key={comparison.id} style={styles.card}>
              {/* Route + price */}
              <View style={commonStyles.rowBetween}>
                <View style={{ flex: 1, paddingRight: ms(12) }}>
                  <Text style={styles.routeText} numberOfLines={1}>
                    {comparison.originAddress}
                  </Text>
                  <View style={styles.routeArrow}>
                    <View style={styles.routeLine} />
                    <Feather name="arrow-down" size={ms(10)} color="rgba(255,255,255,0.25)" />
                  </View>
                  <Text style={styles.routeText} numberOfLines={1}>
                    {comparison.destinationAddress}
                  </Text>
                  <Text style={styles.tripMeta}>
                    {formatDateTime(comparison.createdAt)}
                    {comparison.routeDistanceKm
                      ? `  ·  ${formatDistance(comparison.routeDistanceKm)}`
                      : ""}
                  </Text>
                </View>
                <View style={styles.priceBlock}>
                  <Text style={styles.bestLabel}>BEST</Text>
                  <Text style={styles.bestPrice}>
                    {bestPrice != null ? formatCurrency(bestPrice) : "—"}
                  </Text>
                </View>
              </View>

              {/* Platform badges */}
              <View style={styles.badgesRow}>
                {platforms.map((p, i) => (
                  <View
                    key={p}
                    style={[
                      styles.badge,
                      { backgroundColor: `${PLATFORM_COLORS[i % PLATFORM_COLORS.length]}18` },
                    ]}
                  >
                    <View
                      style={[
                        styles.badgeDot,
                        { backgroundColor: PLATFORM_COLORS[i % PLATFORM_COLORS.length] },
                      ]}
                    />
                    <Text
                      style={[
                        styles.badgeText,
                        { color: PLATFORM_COLORS[i % PLATFORM_COLORS.length] },
                      ]}
                    >
                      {platformLabel(p)[0]}
                    </Text>
                  </View>
                ))}
                {cheapest ? (
                  <Text style={styles.cheapestNote}>
                    {cheapest.platformLabel} cheapest
                  </Text>
                ) : null}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <PrimaryButton
                  label="Repeat"
                  style={{ flex: 1, height: ms(40), borderRadius: ms(10) }}
                  onPress={() => navigation.navigate(ROUTES.HOME)}
                />
                <SecondaryButton
                  label="Details"
                  style={{ flex: 1, height: ms(40), borderRadius: ms(10) }}
                  onPress={() => navigation.navigate(ROUTES.RIDE_MATCH, { comparison })}
                />
              </View>
            </View>
          );
        })}

        {!loading && !error && data?.length > 0 ? (
          <View style={styles.endBlock}>
            <View style={styles.endCircle}>
              <Feather name="check" size={ms(16)} color="rgba(255,255,255,0.3)" />
            </View>
            <Text style={styles.endText}>End of history</Text>
            <Text style={styles.endMeta}>You've seen all your recent trips.</Text>
          </View>
        ) : null}
      </View>
    </ScreenWrap>
  );
};

const styles = StyleSheet.create({
  screenTitle: {
    color: "#fff",
    fontSize: ms(20),
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(6),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: ms(12),
    paddingVertical: ms(7),
  },
  filterText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: ms(11),
    fontWeight: "600",
  },
  card: {
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: ms(16),
    gap: ms(14),
  },
  routeText: {
    color: "#fff",
    fontSize: ms(13),
    fontWeight: "600",
  },
  routeArrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(4),
    paddingVertical: ms(4),
  },
  routeLine: {
    width: ms(1),
    height: ms(12),
    backgroundColor: "rgba(255,255,255,0.2)",
    marginLeft: ms(4),
  },
  tripMeta: {
    color: "rgba(255,255,255,0.35)",
    fontSize: ms(11),
    marginTop: ms(6),
  },
  priceBlock: {
    alignItems: "flex-end",
    justifyContent: "center",
    gap: ms(2),
  },
  bestLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: ms(9),
    fontWeight: "700",
    letterSpacing: ms(1),
  },
  bestPrice: {
    color: COLORS.fuchsia,
    fontSize: ms(18),
    fontWeight: "700",
  },
  badgesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
    flexWrap: "wrap",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(5),
    borderRadius: ms(8),
    paddingHorizontal: ms(10),
    paddingVertical: ms(5),
  },
  badgeDot: {
    width: ms(5),
    height: ms(5),
    borderRadius: ms(3),
  },
  badgeText: {
    fontSize: ms(11),
    fontWeight: "600",
  },
  cheapestNote: {
    color: "rgba(255,255,255,0.35)",
    fontSize: ms(11),
  },
  actions: {
    flexDirection: "row",
    gap: ms(10),
  },
  endBlock: {
    alignItems: "center",
    gap: ms(8),
    paddingVertical: ms(20),
  },
  endCircle: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  endText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(13),
    fontWeight: "600",
  },
  endMeta: {
    color: "rgba(255,255,255,0.3)",
    fontSize: ms(11),
  },
});

export default HistoryScreen;
