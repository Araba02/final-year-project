/**
 * screens/HistoryScreen.js
 * ─────────────────────────
 * Live comparison history for the authenticated user (/rides/history).
 * Layout matches the Figma "History" frame, with loading/error/empty states.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";

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

const BADGE_STYLES = ["historyBadgeGreen", "historyBadgePink", "historyBadgeAmber"];

function summarize(comparison) {
  const fares = comparison.options.map((o) => o.fareEstimate).filter((n) => Number.isFinite(n));
  const bestPrice = fares.length ? Math.min(...fares) : null;
  const platforms = [...new Set(comparison.options.map((o) => o.platform))];
  const cheapest = comparison.options.reduce(
    (best, o) => (!best || o.fareEstimate < best.fareEstimate ? o : best),
    null
  );
  return { bestPrice, platforms, cheapest };
}

export const HistoryScreen = ({ navigation }) => {
  const { data, loading, error, refetch } = useApi(() => ridesService.getHistory({ limit: 30 }), []);

  return (
    <ScreenWrap title="History" footer={<BottomNav navigation={navigation} active="history" />}>
      <View style={{ gap: ms(16) }}>
        <View style={commonStyles.rowBetween}>
          <View style={commonStyles.rowCenter}>
            <Text style={commonStyles.backArrow}>&lt;-</Text>
            <Text style={commonStyles.sectionTitleSmall}>History</Text>
          </View>
          <View style={styles.filterPill}>
            <Text style={styles.filterPillText}>Last 30 Days</Text>
          </View>
        </View>

        {loading ? <LoadingState label="Loading your history…" /> : null}
        {!loading && error ? <ErrorState message={error.message} onRetry={refetch} /> : null}
        {!loading && !error && data && data.length === 0 ? (
          <EmptyState
            icon="clock"
            title="No trips yet"
            message="Your ride comparisons will show up here."
          />
        ) : null}

        {!loading && !error && data
          ? data.map((comparison) => {
              const { bestPrice, platforms, cheapest } = summarize(comparison);
              return (
                <View key={comparison.id} style={commonStyles.card}>
                  <View style={commonStyles.rowBetween}>
                    <View style={{ flex: 1, paddingRight: ms(10) }}>
                      <Text style={commonStyles.listItemTitle} numberOfLines={1}>
                        {comparison.originAddress} -> {comparison.destinationAddress}
                      </Text>
                      <Text style={commonStyles.listItemMeta}>
                        {formatDateTime(comparison.createdAt)}
                        {comparison.routeDistanceKm ? ` · ${formatDistance(comparison.routeDistanceKm)}` : ""}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={commonStyles.smallLabel}>BEST OPTION</Text>
                      <Text style={commonStyles.priceText}>
                        {bestPrice != null ? formatCurrency(bestPrice) : "—"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.historyBadges}>
                    {platforms.map((p, index) => (
                      <View key={p} style={[styles.historyBadge, styles[BADGE_STYLES[index % BADGE_STYLES.length]]]}>
                        <Text style={styles.historyBadgeText}>{platformLabel(p)[0]}</Text>
                      </View>
                    ))}
                    <Text style={commonStyles.listItemMeta}>
                      Compared {platforms.length} platform{platforms.length === 1 ? "" : "s"}
                      {cheapest ? ` · ${cheapest.platformLabel} cheapest` : ""}
                    </Text>
                  </View>

                  <View style={styles.historyButtons}>
                    <PrimaryButton
                      label="Repeat Search"
                      style={{ flex: 1 }}
                      onPress={() => navigation.navigate(ROUTES.HOME)}
                    />
                    <SecondaryButton
                      label="Details"
                      style={{ flex: 1 }}
                      onPress={() => navigation.navigate(ROUTES.RIDE_MATCH, { comparison })}
                    />
                  </View>
                </View>
              );
            })
          : null}

        {!loading && !error && data && data.length > 0 ? (
          <View style={styles.historyEnd}>
            <View style={styles.historyEndCircle} />
            <Text style={styles.historyEndText}>End of History</Text>
            <Text style={styles.historyEndMeta}>Youve reached the end of your recent trips.</Text>
          </View>
        ) : null}
      </View>
    </ScreenWrap>
  );
};

const styles = StyleSheet.create({
  filterPill: {
    borderRadius: ms(999),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
  },
  filterPillText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: ms(10),
    fontWeight: "600",
  },
  historyBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
    marginTop: ms(10),
    flexWrap: "wrap",
  },
  historyBadge: {
    borderRadius: ms(999),
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
  },
  historyBadgeGreen: {
    backgroundColor: "rgba(52,211,153,0.2)",
  },
  historyBadgePink: {
    backgroundColor: "rgba(255,79,154,0.2)",
  },
  historyBadgeAmber: {
    backgroundColor: "rgba(251,191,36,0.2)",
  },
  historyBadgeText: {
    color: "#fff",
    fontSize: ms(9),
    fontWeight: "600",
  },
  historyButtons: {
    marginTop: ms(12),
    flexDirection: "row",
    gap: ms(10),
  },
  historyEnd: {
    marginTop: ms(12),
    alignItems: "center",
    gap: ms(6),
  },
  historyEndCircle: {
    width: ms(48),
    height: ms(48),
    borderRadius: ms(24),
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
  },
  historyEndText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(12),
  },
  historyEndMeta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(10),
  },
});

export default HistoryScreen;
