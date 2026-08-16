import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenWrap, BottomNav } from "../components/layout";
import { LoadingState, ErrorState } from "../components/feedback";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { formatCurrency } from "../utils/format";
import { analyticsService } from "../services";
import { useApi } from "../hooks";

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
    const [summary, predictions, trends, popularRoutes] = await Promise.all([
      analyticsService.getSummary().catch(() => null),
      analyticsService.getSurgePredictions(),
      analyticsService.getFareTrends({ days: 30 }),
      analyticsService.getPopularRoutes({ limit: 5 }).catch(() => []),
    ]);
    return { summary, predictions, trends, popularRoutes };
  }, []);

  const renderBody = () => {
    if (loading) return <LoadingState label="Crunching the numbers…" />;
    if (error) return <ErrorState message={error.message} onRetry={refetch} />;

    const predictions  = data?.predictions || [];
    const priceBars    = avgByPlatform(data?.trends?.points);
    const maxAvg       = priceBars.reduce((m, p) => Math.max(m, p.avg), 0) || 1;
    const cheapest     = priceBars[0];
    const topSurges    = [...predictions].sort((a, b) => b.probability - a.probability).slice(0, 2);
    const peak         = topSurges[0];
    const summary      = data?.summary;
    const popularRoutes = data?.popularRoutes || [];

    return (
      <>
        {/* Daily Trends */}
        <View style={styles.trendCard}>
          <LinearGradient
            colors={["rgba(255,79,154,0.1)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={commonStyles.rowBetween}>
            <Text style={styles.trendTitle}>
              {peak ? `Peak: ${fmtHour(peak.hour)}` : "Daily Trends"}
            </Text>
            {summary ? (
              <View style={styles.surgePct}>
                <Text style={styles.surgePctText}>{summary.surgeFrequencyPct}% surge</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.trendSub}>Daily ride demand curve</Text>
          <View style={styles.trendGraph}>
            {[0.3, 0.5, 0.8, 1.0, 0.7, 0.4, 0.6, 0.9, 0.6, 0.3].map((h, i) => (
              <View key={i} style={[styles.trendBar, { height: `${h * 100}%` }]} />
            ))}
          </View>
          <View style={styles.trendLabels}>
            {["6AM", "9AM", "12PM", "3PM", "6PM", "9PM"].map((l) => (
              <Text key={l} style={styles.trendLabel}>{l}</Text>
            ))}
          </View>
        </View>

        {/* Stats banner */}
        <View style={styles.statsBanner}>
          <LinearGradient
            colors={[COLORS.fuchsia, "#c2005a"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.statsLabel}>YOUR LAST 30 DAYS</Text>
            <Text style={styles.statsValue}>
              {summary ? `${summary.totalComparisons} comparisons` : "Start comparing"}
            </Text>
            <Text style={styles.statsMeta}>
              {summary
                ? `Avg fare ${formatCurrency(summary.averageFare)} · ${summary.mostUsedPlatform}`
                : "Run your first comparison to unlock insights."}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="car"
            size={ms(70)}
            color="rgba(255,255,255,0.15)"
            style={styles.statsCar}
          />
        </View>

        {/* Surge forecast */}
        <View style={{ gap: ms(10) }}>
          <View style={commonStyles.rowCenter}>
            <View style={styles.zapWrap}>
              <Feather name="zap" size={ms(12)} color="#fbbf24" />
            </View>
            <Text style={styles.sectionTitle}>Surge Forecast</Text>
          </View>
          {topSurges.length ? topSurges.map((s, i) => (
            <View
              key={`${s.platform}-${s.hour}`}
              style={[styles.surgeCard, i === 0 && styles.surgeCardHighlight]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.surgeCardTitle}>
                  {s.platformLabel} · {fmtHour(s.hour)}
                </Text>
                <Text style={styles.surgeCardMeta}>{s.riskLevel} surge risk</Text>
              </View>
              <View style={[styles.probBadge, i === 0 && styles.probBadgeHighlight]}>
                <Text style={[styles.probText, i === 0 && styles.probTextHighlight]}>
                  {Math.round(s.probability * 100)}%
                </Text>
              </View>
            </View>
          )) : (
            <Text style={styles.emptyNote}>No surge forecast available.</Text>
          )}
        </View>

        {/* Price comparison */}
        <View style={styles.section}>
          <View style={commonStyles.rowCenter}>
            <View style={styles.barWrap}>
              <Feather name="bar-chart-2" size={ms(12)} color="#ffb6d7" />
            </View>
            <Text style={styles.sectionTitle}>Price Comparison</Text>
          </View>
          {priceBars.length ? priceBars.map((item) => (
            <View key={item.platform} style={styles.priceRow}>
              <View style={commonStyles.rowBetween}>
                <Text style={styles.priceLabel}>{item.label}</Text>
                <Text style={styles.priceValue}>{formatCurrency(item.avg)} avg</Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.max(8, (item.avg / maxAvg) * 100)}%` }]} />
              </View>
            </View>
          )) : (
            <Text style={styles.emptyNote}>No fare data yet.</Text>
          )}
          {cheapest ? (
            <View style={styles.tip}>
              <Ionicons name="bulb" size={ms(14)} color="#ffb6d7" />
              <Text style={styles.tipText}>
                Smart tip: {cheapest.label} has the lowest fares right now.
              </Text>
            </View>
          ) : null}
        </View>

        {/* Popular routes */}
        <View style={styles.section}>
          <View style={commonStyles.rowCenter}>
            <View style={styles.barWrap}>
              <Feather name="navigation" size={ms(12)} color="#ffb6d7" />
            </View>
            <Text style={styles.sectionTitle}>Popular Routes</Text>
          </View>
          {popularRoutes.length ? (
            popularRoutes.map((route, i) => (
              <View key={i} style={styles.routeRow}>
                <View style={styles.routeIndex}>
                  <Text style={styles.routeIndexText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.routeName} numberOfLines={1}>
                    {route.originAddress} → {route.destinationAddress}
                  </Text>
                  <Text style={styles.routeTime}>
                    {route.count} searches
                    {route.avgDurationMin ? ` · ~${route.avgDurationMin} min` : ""}
                  </Text>
                </View>
                <Feather name="chevron-right" size={ms(14)} color="rgba(255,255,255,0.25)" />
              </View>
            ))
          ) : (
            <Text style={styles.emptyNote}>
              Popular routes appear here once comparisons are made.
            </Text>
          )}
        </View>

        {/* Demand map */}
        <View style={styles.demandCard}>
          <LinearGradient
            colors={["rgba(255,79,154,0.12)", "rgba(255,79,154,0.04)"]}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.sectionTitle}>Demand Map</Text>
          <View style={styles.demandViz}>
            <View style={styles.demandGlow} />
            <View style={styles.demandPin}>
              <Ionicons name="location" size={ms(18)} color="#fff" />
            </View>
          </View>
          <Text style={styles.demandCity}>Accra Central</Text>
          <Text style={styles.demandMeta}>Live demand · High activity</Text>
        </View>
      </>
    );
  };

  return (
    <ScreenWrap footer={<BottomNav navigation={navigation} active="insights" />}>
      <View style={{ gap: ms(20) }}>
        <View style={commonStyles.rowCenter}>
          <Pressable onPress={() => navigation.canGoBack() && navigation.goBack()} hitSlop={12}>
            <Feather name="chevron-left" size={ms(22)} color="rgba(255,255,255,0.8)" />
          </Pressable>
          <Text style={styles.screenTitle}>Insights</Text>
        </View>
        {renderBody()}
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
  trendCard: {
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    padding: ms(18),
    overflow: "hidden",
    gap: ms(4),
  },
  trendTitle: {
    color: "#fff",
    fontSize: ms(16),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  trendSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(11),
  },
  surgePct: {
    borderRadius: ms(8),
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    backgroundColor: "rgba(52,211,153,0.15)",
  },
  surgePctText: {
    color: "#34d399",
    fontSize: ms(10),
    fontWeight: "700",
  },
  trendGraph: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: ms(4),
    height: ms(64),
    marginTop: ms(14),
  },
  trendBar: {
    flex: 1,
    borderRadius: ms(4),
    backgroundColor: COLORS.fuchsia,
    opacity: 0.7,
    minHeight: ms(6),
  },
  trendLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: ms(8),
  },
  trendLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: ms(9),
  },
  statsBanner: {
    borderRadius: ms(20),
    padding: ms(20),
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  statsLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: ms(10),
    fontWeight: "700",
    letterSpacing: ms(1),
  },
  statsValue: {
    color: "#fff",
    fontSize: ms(20),
    fontWeight: "700",
    marginTop: ms(4),
    letterSpacing: -0.3,
  },
  statsMeta: {
    color: "rgba(255,255,255,0.7)",
    fontSize: ms(12),
    marginTop: ms(4),
    maxWidth: "80%",
    lineHeight: ms(17),
  },
  statsCar: {
    position: "absolute",
    right: ms(-8),
    bottom: ms(-8),
  },
  zapWrap: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(8),
    backgroundColor: "rgba(251,191,36,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  barWrap: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(8),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: ms(15),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  section: {
    gap: ms(12),
  },
  surgeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: ms(14),
  },
  surgeCardHighlight: {
    borderColor: "rgba(251,191,36,0.3)",
    backgroundColor: "rgba(251,191,36,0.06)",
  },
  surgeCardTitle: {
    color: "#fff",
    fontSize: ms(13),
    fontWeight: "600",
  },
  surgeCardMeta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(11),
    marginTop: ms(2),
  },
  probBadge: {
    borderRadius: ms(10),
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  probBadgeHighlight: {
    backgroundColor: "rgba(251,191,36,0.15)",
  },
  probText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(13),
    fontWeight: "700",
  },
  probTextHighlight: {
    color: "#fbbf24",
  },
  priceRow: {
    gap: ms(8),
  },
  priceLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: ms(12),
  },
  priceValue: {
    color: "rgba(255,255,255,0.6)",
    fontSize: ms(12),
  },
  track: {
    height: ms(6),
    borderRadius: ms(4),
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  fill: {
    height: ms(6),
    borderRadius: ms(4),
    backgroundColor: COLORS.fuchsia,
  },
  tip: {
    flexDirection: "row",
    gap: ms(8),
    alignItems: "center",
    borderRadius: ms(12),
    backgroundColor: COLORS.fuchsiaSoft,
    padding: ms(12),
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
  },
  tipText: {
    color: "#ffb6d7",
    fontSize: ms(12),
    flex: 1,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
    borderRadius: ms(12),
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: ms(14),
    paddingVertical: ms(12),
  },
  routeIndex: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(8),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  routeIndexText: {
    color: "#ffb6d7",
    fontSize: ms(11),
    fontWeight: "700",
  },
  routeName: {
    color: "#fff",
    fontSize: ms(13),
    fontWeight: "600",
  },
  routeTime: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(11),
    marginTop: ms(2),
  },
  demandCard: {
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    padding: ms(18),
    alignItems: "center",
    overflow: "hidden",
    gap: ms(8),
  },
  demandViz: {
    width: ms(120),
    height: ms(100),
    alignItems: "center",
    justifyContent: "center",
  },
  demandGlow: {
    position: "absolute",
    width: ms(90),
    height: ms(90),
    borderRadius: ms(45),
    backgroundColor: COLORS.fuchsia,
    opacity: 0.25,
  },
  demandPin: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.5,
    shadowRadius: ms(12),
    shadowOffset: { width: 0, height: ms(4) },
  },
  demandCity: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  demandMeta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(11),
  },
  emptyNote: {
    color: "rgba(255,255,255,0.35)",
    fontSize: ms(12),
  },
});

export default InsightsScreen;
