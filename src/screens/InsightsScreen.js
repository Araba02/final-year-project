/**
 * screens/InsightsScreen.js
 * ──────────────────────────
 * Analytics dashboard backed by /analytics/{summary,surge-predictions,
 * fare-trends}. Derives price comparison, surge alerts and best/peak hours
 * from live data. Popular routes + demand map remain illustrative. Layout
 * matches the Figma "Insights" frame.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { ScreenWrap, BottomNav } from "../components/layout";
import { LoadingState, ErrorState } from "../components/feedback";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { formatCurrency } from "../utils/format";
import { analyticsService } from "../services";
import { useApi } from "../hooks";
import { POPULAR_ROUTES } from "../constants/mockData";

const fmtHour = (h) => {
  const hour = ((h % 24) + 24) % 24;
  const period = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${period}`;
};

function avgByPlatform(points = []) {
  const map = {};
  points.forEach((p) => {
    map[p.platform] = map[p.platform] || { sum: 0, n: 0, label: p.platformLabel };
    map[p.platform].sum += p.avgFare;
    map[p.platform].n += 1;
  });
  return Object.entries(map)
    .map(([platform, v]) => ({ platform, label: v.label, avg: v.sum / v.n }))
    .sort((a, b) => a.avg - b.avg);
}

export const InsightsScreen = ({ navigation }) => {
  const { data, loading, error, refetch } = useApi(async () => {
    const [summary, predictions, trends] = await Promise.all([
      analyticsService.getSummary().catch(() => null),
      analyticsService.getSurgePredictions(),
      analyticsService.getFareTrends({ days: 30 }),
    ]);
    return { summary, predictions, trends };
  }, []);

  const renderBody = () => {
    if (loading) return <LoadingState label="Crunching the numbers…" />;
    if (error) return <ErrorState message={error.message} onRetry={refetch} />;

    const predictions = data?.predictions || [];
    const priceBars = avgByPlatform(data?.trends?.points);
    const maxAvg = priceBars.reduce((m, p) => Math.max(m, p.avg), 0) || 1;
    const cheapest = priceBars[0];

    const sortedByProb = [...predictions].sort((a, b) => b.probability - a.probability);
    const topSurges = sortedByProb.slice(0, 2);
    const peak = sortedByProb[0];
    const summary = data?.summary;

    return (
      <>
        {/* Daily trends */}
        <View style={commonStyles.card}>
          <View style={commonStyles.rowBetween}>
            <Text style={commonStyles.smallText}>Daily Ride Trends</Text>
            {summary ? (
              <View style={styles.greenBadge}>
                <Text style={styles.greenBadgeText}>{summary.surgeFrequencyPct}% surge</Text>
              </View>
            ) : null}
          </View>
          <Text style={commonStyles.sectionTitle}>
            {peak ? `Peak: ${fmtHour(peak.hour)}` : "Peak: —"}
          </Text>
          <View style={styles.trendBox}>
            <View style={styles.trendLine} />
            <View style={styles.trendLabels}>
              {["6AM", "12PM", "6PM", "12AM"].map((label) => (
                <Text key={label} style={styles.trendLabel}>{label}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* Best time / summary */}
        <View style={styles.bestTimeCard}>
          <Text style={commonStyles.sectionLabel}>YOUR STATS · LAST 30 DAYS</Text>
          <Text style={styles.bestTimeTitle}>
            {summary ? `${summary.totalComparisons} comparisons` : "Start comparing"}
          </Text>
          <Text style={styles.bestTimeText}>
            {summary
              ? `Average fare ${formatCurrency(summary.averageFare)} · most used ${summary.mostUsedPlatform}.`
              : "Run a comparison to unlock personalized insights."}
          </Text>
          <MaterialCommunityIcons name="car" size={ms(80)} color="rgba(255,255,255,0.2)" style={styles.bestTimeIcon} />
        </View>

        {/* Surge alerts */}
        <View>
          <View style={commonStyles.rowCenter}>
            <Text style={styles.triangle}>^</Text>
            <Text style={commonStyles.sectionTitleSmall}>Surge Pricing Forecast</Text>
          </View>
          <View style={{ gap: ms(12), marginTop: ms(10) }}>
            {topSurges.length ? (
              topSurges.map((s, i) => (
                <View
                  key={`${s.platform}-${s.hour}`}
                  style={[commonStyles.card, i === 0 && { borderColor: COLORS.fuchsiaBorder }]}
                >
                  <View style={commonStyles.rowBetween}>
                    <View>
                      <Text style={commonStyles.listItemTitle}>
                        {s.platformLabel} · {fmtHour(s.hour)}
                      </Text>
                      <Text style={commonStyles.listItemMeta}>{s.riskLevel} surge risk</Text>
                    </View>
                    <Text style={i === 0 ? commonStyles.priceText : commonStyles.listItemMeta}>
                      {Math.round(s.probability * 100)}%
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={commonStyles.listItemMeta}>No surge forecast available.</Text>
            )}
          </View>
        </View>

        {/* Price comparison */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionLabel}>PRICE COMPARISON (GHS)</Text>
          <View style={{ gap: ms(12), marginTop: ms(12) }}>
            {priceBars.length ? (
              priceBars.map((item) => (
                <View key={item.platform}>
                  <View style={commonStyles.rowBetween}>
                    <Text style={commonStyles.listItemMeta}>{item.label}</Text>
                    <Text style={commonStyles.listItemMeta}>{formatCurrency(item.avg)} avg</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.max(8, (item.avg / maxAvg) * 100)}%` }]} />
                  </View>
                </View>
              ))
            ) : (
              <Text style={commonStyles.listItemMeta}>No fare data for this period yet.</Text>
            )}
          </View>
          {cheapest ? (
            <View style={styles.tipCard}>
              <Ionicons name="location" size={ms(14)} color="#ffb6d7" />
              <Text style={styles.tipText}>
                Smart Tip: {cheapest.label} has the lowest average fare right now.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Popular routes (illustrative) */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.listTitle}>Popular Routes</Text>
          <View style={{ gap: ms(10), marginTop: ms(12) }}>
            {POPULAR_ROUTES.map((route) => (
              <View key={route.id} style={styles.popularRow}>
                <View style={styles.popularLeft}>
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>{route.id}</Text>
                  </View>
                  <View>
                    <Text style={commonStyles.listItemTitle}>{route.route}</Text>
                    <Text style={commonStyles.listItemMeta}>{route.time}</Text>
                  </View>
                </View>
                <Text style={commonStyles.listArrow}>&gt;</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Demand map */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.listTitle}>Demand Map</Text>
          <View style={styles.demandBox}>
            <View style={styles.demandGlow} />
            <View style={styles.demandPin}>
              <Ionicons name="location" size={ms(16)} color="#fff" />
            </View>
          </View>
          <Text style={styles.demandTitle}>Accra Central</Text>
          <Text style={styles.demandMeta}>Live demand</Text>
        </View>
      </>
    );
  };

  return (
    <ScreenWrap title="Insights" footer={<BottomNav navigation={navigation} active="insights" />}>
      <View style={{ gap: ms(16) }}>
        <View style={commonStyles.rowCenter}>
          <Text style={commonStyles.backArrow}>&lt;-</Text>
          <Text style={commonStyles.sectionTitleSmall}>Insights</Text>
        </View>
        {renderBody()}
      </View>
    </ScreenWrap>
  );
};

const styles = StyleSheet.create({
  greenBadge: {
    borderRadius: ms(999),
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    backgroundColor: "rgba(52,211,153,0.2)",
  },
  greenBadgeText: {
    color: "#6ee7b7",
    fontSize: ms(9),
    fontWeight: "600",
  },
  trendBox: {
    marginTop: ms(12),
    borderRadius: ms(16),
    backgroundColor: "#1f0b14",
    padding: ms(12),
  },
  trendLine: {
    height: ms(60),
    borderRadius: ms(12),
    backgroundColor: "rgba(255,79,154,0.1)",
  },
  trendLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: ms(8),
  },
  trendLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(9),
  },
  bestTimeCard: {
    borderRadius: ms(24),
    backgroundColor: COLORS.fuchsia,
    padding: ms(16),
    overflow: "hidden",
  },
  bestTimeTitle: {
    color: "#fff",
    fontSize: ms(18),
    fontWeight: "600",
    marginTop: ms(6),
  },
  bestTimeText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: ms(12),
    marginTop: ms(6),
    maxWidth: "82%",
  },
  bestTimeIcon: {
    position: "absolute",
    right: ms(-10),
    bottom: ms(-10),
  },
  triangle: {
    color: COLORS.fuchsia,
    fontSize: ms(10),
  },
  progressTrack: {
    height: ms(8),
    borderRadius: ms(999),
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: ms(6),
  },
  progressFill: {
    height: ms(8),
    borderRadius: ms(999),
    backgroundColor: COLORS.fuchsia,
  },
  tipCard: {
    marginTop: ms(12),
    borderRadius: ms(14),
    backgroundColor: COLORS.fuchsiaSoft,
    paddingHorizontal: ms(10),
    paddingVertical: ms(8),
    flexDirection: "row",
    gap: ms(8),
    alignItems: "center",
  },
  tipText: {
    color: "#ffb6d7",
    fontSize: ms(10),
    flex: 1,
  },
  popularRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: ms(16),
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: ms(12),
    paddingVertical: ms(8),
  },
  popularLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
  },
  popularBadge: {
    width: ms(20),
    height: ms(20),
    borderRadius: ms(10),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  popularBadgeText: {
    color: "#ffb6d7",
    fontSize: ms(10),
    fontWeight: "600",
  },
  demandBox: {
    marginTop: ms(12),
    height: ms(120),
    borderRadius: ms(20),
    backgroundColor: "#1f0b14",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  demandGlow: {
    position: "absolute",
    width: ms(100),
    height: ms(100),
    borderRadius: ms(50),
    backgroundColor: "rgba(255,79,154,0.3)",
    opacity: 0.9,
  },
  demandPin: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(20),
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center",
  },
  demandTitle: {
    color: "#fff",
    fontSize: ms(12),
    fontWeight: "600",
    textAlign: "center",
    marginTop: ms(8),
  },
  demandMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(10),
    textAlign: "center",
  },
});

export default InsightsScreen;
