import React, { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenWrap, BottomNav } from "../components/layout";
import { PrimaryButton } from "../components/Button";
import { EmptyState } from "../components/feedback";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { platformColor } from "../utils/format";
import { ridesService, tokenStorage } from "../services";
import { mapComparison } from "../services/ridesService";
import { ENV } from "../config/env";
import { ROUTES } from "../navigation/routes";

const SORT_OPTIONS = [
  { key: "cost",   label: "Cheapest", icon: "tag" },
  { key: "time",   label: "Fastest",  icon: "zap" },
  { key: "rating", label: "Top Rated", icon: "star" },
];

export const RideMatchScreen = ({ navigation, route }) => {
  const params = route?.params || {};
  const [comparison, setComparison] = useState(params.comparison || null);
  const [sortBy, setSortBy]         = useState(params.sortBy || "cost");
  const [resorting, setResorting]   = useState(false);

  const origin      = params.origin;
  const destination = params.destination;

  // Live price streaming via WebSocket.
  const wsRef   = useRef(null);
  const pingRef = useRef(null);

  useEffect(() => {
    if (!comparison?.id) return;
    let cancelled = false;

    (async () => {
      const tokens = await tokenStorage.getTokens().catch(() => ({}));
      const token  = tokens?.accessToken;
      const url    = `${ENV.WS_BASE_URL}/ws/rides/${comparison.id}${token ? `?token=${token}` : ""}`;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 25000);
      };

      ws.onmessage = (e) => {
        if (cancelled) return;
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "price_update" && msg.data) {
            setComparison(mapComparison(msg.data));
          }
        } catch {}
      };

      ws.onerror  = () => {};
      ws.onclose  = () => { clearInterval(pingRef.current); };
    })();

    return () => {
      cancelled = true;
      clearInterval(pingRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [comparison?.id]);

  const handleSort = async (key) => {
    if (key === sortBy || !origin || !destination) { setSortBy(key); return; }
    setSortBy(key);
    setResorting(true);
    try {
      const next = await ridesService.compare({ origin, destination, sortBy: key });
      setComparison(next);
    } catch { /* keep previous results */ }
    finally { setResorting(false); }
  };

  if (!comparison) {
    return (
      <ScreenWrap footer={<BottomNav navigation={navigation} active="home" />}>
        <EmptyState
          icon="navigation"
          title="No comparison yet"
          message="Choose a pickup and destination on Home to compare rides."
        />
      </ScreenWrap>
    );
  }

  const recommendation = comparison.recommendation || comparison.options[0];
  const alternatives   = comparison.options.filter((o) => o.id !== recommendation?.id);

  return (
    <ScreenWrap footer={<BottomNav navigation={navigation} active="home" />}>
      <View style={{ gap: ms(20) }}>

        {/* ── Header ── */}
        <View>
          <Text style={styles.screenTitle}>Best Rides</Text>
          <Text style={styles.screenMeta} numberOfLines={1}>
            To: {comparison.destinationAddress}
          </Text>
        </View>

        {/* ── Surge banner ── */}
        {comparison.isSurgeDetected ? (
          <View style={styles.surgeBanner}>
            <View style={styles.surgeIconWrap}>
              <Feather name="zap" size={ms(14)} color="#fbbf24" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.surgeTitle}>Surge Pricing Active</Text>
              <Text style={styles.surgeText}>
                {comparison.surgeWarning || "Higher demand right now — prices are elevated."}
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── Sort chips ── */}
        <View style={styles.chipRow}>
          {SORT_OPTIONS.map((opt) => {
            const active = opt.key === sortBy;
            return (
              <Pressable
                key={opt.key}
                onPress={() => handleSort(opt.key)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Feather
                  name={opt.icon}
                  size={ms(12)}
                  color={active ? COLORS.fuchsia : "rgba(255,255,255,0.45)"}
                />
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
          {resorting ? (
            <ActivityIndicator color={COLORS.fuchsia} size="small" style={{ marginLeft: ms(4) }} />
          ) : null}
        </View>

        {/* ── Best recommendation ── */}
        {recommendation ? (
          <View>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={commonStyles.sectionLabel}>BEST MATCH</Text>
            </View>
            <View style={styles.bestCard}>
              <LinearGradient
                colors={["rgba(255,79,154,0.14)", "rgba(255,79,154,0.04)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.bestTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bestMeta}>
                    {recommendation.rideCategory.toUpperCase()} · {recommendation.eta} min ETA
                  </Text>
                  <Text style={styles.bestPrice}>{recommendation.priceLabel}</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: ms(6) }}>
                  <View style={styles.bestBadge}>
                    <Text style={styles.bestBadgeText}>Best</Text>
                  </View>
                  <Text style={styles.bestPlatform}>{recommendation.platformLabel}</Text>
                </View>
              </View>

              <View style={styles.bestDivider} />

              <View style={styles.bestBottomRow}>
                <View style={commonStyles.driverRow}>
                  <View style={styles.driverAvatar}>
                    <Feather name="user" size={ms(12)} color="rgba(255,255,255,0.5)" />
                  </View>
                  <View>
                    <Text style={commonStyles.driverName}>
                      <Ionicons name="star" size={ms(10)} color="#f7c35f" />{" "}
                      {recommendation.driverRating.toFixed(1)}
                    </Text>
                    <Text style={commonStyles.driverMeta}>
                      {recommendation.driversNearby} nearby
                    </Text>
                  </View>
                </View>
                <PrimaryButton
                  label="Book Now"
                  style={styles.bookBtn}
                  onPress={() =>
                    navigation.navigate(ROUTES.RIDE_DETAILS, {
                      option: recommendation,
                      comparison,
                      origin,
                      destination,
                    })
                  }
                />
              </View>
            </View>
          </View>
        ) : null}

        {/* ── Alternatives ── */}
        {alternatives.length ? (
          <View>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionDot} />
              <Text style={commonStyles.sectionLabel}>ALTERNATIVES</Text>
            </View>
            <View style={{ gap: ms(10) }}>
              {alternatives.map((ride) => {
                const color = platformColor(ride.platform);
                return (
                  <Pressable
                    key={ride.id}
                    style={styles.rideCard}
                    onPress={() =>
                      navigation.navigate(ROUTES.RIDE_DETAILS, { option: ride, comparison, origin, destination })
                    }
                  >
                    <View style={[styles.ridePlatformBadge, { backgroundColor: `${color}22` }]}>
                      <Text style={[styles.ridePlatformLetter, { color }]}>
                        {ride.platformLabel[0]}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rideLabel}>
                        {ride.platformLabel} · {ride.rideCategory}
                      </Text>
                      <Text style={styles.rideMeta}>
                        {ride.eta} min · {ride.driverRating.toFixed(1)}★
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: ms(4) }}>
                      <Text style={styles.ridePrice}>{ride.priceLabel}</Text>
                      {ride.isSurge ? (
                        <View style={styles.surgeTag}>
                          <Text style={styles.surgeTagText}>Surge</Text>
                        </View>
                      ) : null}
                    </View>
                    <Feather name="chevron-right" size={ms(16)} color="rgba(255,255,255,0.25)" />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>
    </ScreenWrap>
  );
};

const styles = StyleSheet.create({
  screenTitle: {
    color: "#fff",
    fontSize: ms(22),
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  screenMeta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(12),
    marginTop: ms(4),
  },
  surgeBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.25)",
    backgroundColor: "rgba(251,191,36,0.08)",
    padding: ms(14),
  },
  surgeIconWrap: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(10),
    backgroundColor: "rgba(251,191,36,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  surgeTitle: {
    color: "#fbbf24",
    fontSize: ms(12),
    fontWeight: "600",
  },
  surgeText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(11),
    marginTop: ms(2),
  },
  chipRow: {
    flexDirection: "row",
    gap: ms(8),
    alignItems: "center",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(6),
    paddingHorizontal: ms(14),
    paddingVertical: ms(8),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  chipActive: {
    borderColor: COLORS.fuchsiaBorder,
    backgroundColor: COLORS.fuchsiaSoft,
  },
  chipText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: ms(12),
    fontWeight: "600",
  },
  chipTextActive: {
    color: COLORS.fuchsia,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
    marginBottom: ms(10),
  },
  sectionDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: COLORS.fuchsia,
  },
  bestCard: {
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    padding: ms(18),
    overflow: "hidden",
  },
  bestTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  bestMeta: {
    color: "rgba(255,255,255,0.45)",
    fontSize: ms(11),
    fontWeight: "500",
  },
  bestPrice: {
    color: "#fff",
    fontSize: ms(28),
    fontWeight: "700",
    marginTop: ms(4),
    letterSpacing: -0.5,
  },
  bestBadge: {
    borderRadius: ms(8),
    paddingHorizontal: ms(10),
    paddingVertical: ms(4),
    backgroundColor: COLORS.fuchsiaSoft,
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
  },
  bestBadgeText: {
    color: "#ffb6d7",
    fontSize: ms(10),
    fontWeight: "700",
  },
  bestPlatform: {
    color: "#fff",
    fontSize: ms(13),
    fontWeight: "700",
  },
  bestDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: ms(14),
  },
  bestBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  driverAvatar: {
    width: ms(30),
    height: ms(30),
    borderRadius: ms(15),
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  bookBtn: {
    width: ms(100),
    height: ms(38),
    borderRadius: ms(10),
  },
  rideCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: ms(14),
  },
  ridePlatformBadge: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(12),
    alignItems: "center",
    justifyContent: "center",
  },
  ridePlatformLetter: {
    fontSize: ms(15),
    fontWeight: "700",
  },
  rideLabel: {
    color: "#fff",
    fontSize: ms(13),
    fontWeight: "600",
  },
  rideMeta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(11),
    marginTop: ms(2),
  },
  ridePrice: {
    color: COLORS.fuchsia,
    fontSize: ms(14),
    fontWeight: "700",
  },
  surgeTag: {
    borderRadius: ms(6),
    paddingHorizontal: ms(6),
    paddingVertical: ms(2),
    backgroundColor: "rgba(251,191,36,0.15)",
  },
  surgeTagText: {
    color: "#fbbf24",
    fontSize: ms(9),
    fontWeight: "600",
  },
});

export default RideMatchScreen;
