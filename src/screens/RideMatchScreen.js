/**
 * screens/RideMatchScreen.js
 * ───────────────────────────
 * Live ride comparison results. Receives the comparison (+ origin/destination/
 * sortBy) from the compare flow via route params, renders the best
 * recommendation and alternatives, and lets the user re-sort (re-queries the
 * backend). Layout matches the Figma "RideSync+" results frame.
 */
import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ScreenWrap, BottomNav } from "../components/layout";
import { PrimaryButton } from "../components/Button";
import { EmptyState } from "../components/feedback";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { platformColor } from "../utils/format";
import { ridesService } from "../services";
import { ROUTES } from "../navigation/routes";

const SORT_OPTIONS = [
  { key: "cost", label: "Cheapest" },
  { key: "time", label: "Fastest" },
  { key: "rating", label: "Top Rated" },
];

export const RideMatchScreen = ({ navigation, route }) => {
  const params = route?.params || {};
  const [comparison, setComparison] = useState(params.comparison || null);
  const [sortBy, setSortBy] = useState(params.sortBy || "cost");
  const [resorting, setResorting] = useState(false);

  const origin = params.origin;
  const destination = params.destination;

  const handleSort = async (key) => {
    if (key === sortBy || !origin || !destination) {
      setSortBy(key);
      return;
    }
    setSortBy(key);
    setResorting(true);
    try {
      const next = await ridesService.compare({ origin, destination, sortBy: key });
      setComparison(next);
    } catch {
      /* keep previous results on failure */
    } finally {
      setResorting(false);
    }
  };

  if (!comparison) {
    return (
      <ScreenWrap title="RideSync+" footer={<BottomNav navigation={navigation} active="ride" />}>
        <EmptyState
          icon="navigation"
          title="No comparison yet"
          message="Choose a pickup and destination on Home to compare rides."
        />
      </ScreenWrap>
    );
  }

  const recommendation = comparison.recommendation || comparison.options[0];
  const alternatives = comparison.options.filter((o) => o.id !== recommendation?.id);

  return (
    <ScreenWrap title="RideSync+" footer={<BottomNav navigation={navigation} active="ride" />}>
      <View style={{ gap: ms(16) }}>
        <View>
          <Text style={styles.rideBrand}>RideSync+</Text>
          <Text style={styles.rideMeta} numberOfLines={1}>
            To: {comparison.destinationAddress}
          </Text>
        </View>

        {comparison.isSurgeDetected ? (
          <View style={styles.alertCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Surge Pricing Active</Text>
              <Text style={styles.alertText}>
                {comparison.surgeWarning || "Higher demand right now — prices and ETAs are elevated."}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={styles.chipRow}>
          {SORT_OPTIONS.map((opt) => {
            const active = opt.key === sortBy;
            return (
              <Pressable key={opt.key} onPress={() => handleSort(opt.key)} style={active ? commonStyles.chipActive : commonStyles.chip}>
                <Text style={active ? commonStyles.chipActiveText : commonStyles.chipText}>{opt.label}</Text>
              </Pressable>
            );
          })}
          {resorting ? <ActivityIndicator color={COLORS.fuchsia} style={{ marginLeft: ms(4) }} /> : null}
        </View>

        {recommendation ? (
          <View>
            <Text style={commonStyles.sectionLabel}>BEST RECOMMENDATION</Text>
            <View style={styles.bestCard}>
              <View style={styles.bestTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bestMeta}>
                    {recommendation.rideCategory.toUpperCase()} · {recommendation.eta} mins away
                  </Text>
                  <Text style={styles.bestPrice}>{recommendation.priceLabel}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Best Match</Text>
                  </View>
                  <Text style={styles.bestBrand}>{recommendation.platformLabel.toUpperCase()}</Text>
                </View>
              </View>
              <View style={styles.bestBottomRow}>
                <View style={commonStyles.driverRow}>
                  <View style={commonStyles.driverAvatar} />
                  <View>
                    <Text style={commonStyles.driverName}>
                      <Ionicons name="star" size={ms(10)} color="#f7c35f" /> {recommendation.driverRating.toFixed(1)}
                    </Text>
                    <Text style={commonStyles.driverMeta}>{recommendation.driversNearby} drivers nearby</Text>
                  </View>
                </View>
                <PrimaryButton
                  label="Book Now"
                  style={styles.bookButton}
                  onPress={() => navigation.navigate(ROUTES.RIDE_DETAILS, { option: recommendation, comparison })}
                />
              </View>
            </View>
          </View>
        ) : null}

        {alternatives.length ? (
          <View>
            <Text style={commonStyles.sectionLabel}>ALTERNATIVE RIDES</Text>
            {alternatives.map((ride) => {
              const color = platformColor(ride.platform);
              return (
                <Pressable
                  key={ride.id}
                  style={styles.rideCard}
                  onPress={() => navigation.navigate(ROUTES.RIDE_DETAILS, { option: ride, comparison })}
                >
                  <View style={styles.rideLeft}>
                    <View style={[styles.rideBadge, { backgroundColor: `${color}20` }]}>
                      <Text style={[styles.rideBadgeText, { color }]}>{ride.platformLabel[0]}</Text>
                    </View>
                    <View>
                      <Text style={styles.rideLabel}>{ride.platformLabel} {ride.rideCategory}</Text>
                      <Text style={styles.rideMeta}>
                        {ride.eta} mins · {ride.driverRating.toFixed(1)}★
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.ridePrice}>{ride.priceLabel}</Text>
                    <Text style={styles.rideTag}>{ride.isSurge ? "Surge" : "Standard"}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </ScreenWrap>
  );
};

const styles = StyleSheet.create({
  rideBrand: {
    color: "#fff",
    fontWeight: "600",
    fontSize: ms(14),
  },
  rideMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(9),
  },
  alertCard: {
    flexDirection: "row",
    gap: ms(12),
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: ms(12),
  },
  alertTitle: {
    color: "#ffb6d7",
    fontSize: ms(11),
  },
  alertText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(9),
    marginTop: ms(4),
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
  },
  bestCard: {
    marginTop: ms(8),
    borderRadius: ms(24),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: ms(16),
  },
  bestTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bestMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(10),
  },
  bestPrice: {
    color: "#fff",
    fontSize: ms(22),
    fontWeight: "700",
    marginTop: ms(4),
  },
  bestBrand: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "600",
    marginTop: ms(8),
  },
  badge: {
    borderRadius: ms(999),
    backgroundColor: COLORS.fuchsiaSoft,
    paddingHorizontal: ms(8),
    paddingVertical: ms(4),
  },
  badgeText: {
    color: "#ffb6d7",
    fontSize: ms(9),
    fontWeight: "600",
  },
  bestBottomRow: {
    marginTop: ms(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bookButton: {
    width: ms(90),
    height: ms(32),
    borderRadius: ms(999),
  },
  rideCard: {
    marginTop: ms(8),
    borderRadius: ms(18),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: ms(12),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rideLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
  },
  rideBadge: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    alignItems: "center",
    justifyContent: "center",
  },
  rideBadgeText: {
    fontSize: ms(12),
    fontWeight: "700",
  },
  rideLabel: {
    color: "#fff",
    fontSize: ms(12),
    fontWeight: "600",
  },
  ridePrice: {
    color: COLORS.fuchsia,
    fontSize: ms(12),
    fontWeight: "700",
  },
  rideTag: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(9),
  },
});

export default RideMatchScreen;
