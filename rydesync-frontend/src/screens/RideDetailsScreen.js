import React from "react";
import { View, Text, Pressable, Linking, Alert, StyleSheet } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenWrap } from "../components/layout";
import { RideMap } from "../components/map";
import { PrimaryButton } from "../components/Button";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { ROUTES } from "../navigation/routes";

function buildViewModel(params) {
  const { option, comparison, origin, destination } = params;

  // Coordinates for the map (passed through from RideMatch → RideDetails)
  const mapOrigin = origin?.lat
    ? { lat: origin.lat, lng: origin.lng }
    : comparison?.originLat
    ? { lat: comparison.originLat, lng: comparison.originLng }
    : null;

  const mapDest = destination?.lat
    ? { lat: destination.lat, lng: destination.lng }
    : comparison?.destinationLat
    ? { lat: comparison.destinationLat, lng: comparison.destinationLng }
    : null;

  if (option) {
    const chips = [option.rideCategory, `${option.driversNearby} nearby`];
    if (option.isSurge) chips.push(`${option.surgeMultiplier}x surge`);
    return {
      platform: option.platformLabel,
      category: option.rideCategory,
      price:    option.priceLabel,
      eta:      `${option.eta} min away`,
      rating:   Number(option.driverRating).toFixed(1),
      chips,
      pickup:   comparison?.originAddress      || origin?.address  || "Your pickup",
      dropoff:  comparison?.destinationAddress || destination?.address || "Your destination",
      deepLink: option.deepLinkUrl,
      mapOrigin,
      mapDest,
    };
  }

  return {
    platform: "—",
    category: "—",
    price:    "—",
    eta:      "—",
    rating:   "—",
    chips:    [],
    pickup:   "—",
    dropoff:  "—",
    deepLink: null,
    mapOrigin,
    mapDest,
  };
}

export const RideDetailsScreen = ({ navigation, route }) => {
  const vm = buildViewModel(route?.params || {});

  const openPlatform = async () => {
    if (!vm.deepLink) { navigation.navigate(ROUTES.HOME); return; }
    try {
      const supported = await Linking.canOpenURL(vm.deepLink);
      if (supported) await Linking.openURL(vm.deepLink);
      else Alert.alert(`Open ${vm.platform}`, `Install the ${vm.platform} app to continue.`);
    } catch {
      Alert.alert("Couldn't open the app", "Please open your ride-hailing app manually.");
    }
  };

  return (
    <ScreenWrap>
      <View style={{ gap: ms(18) }}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.iconBtn} hitSlop={10}>
            <Feather name="chevron-left" size={ms(20)} color="rgba(255,255,255,0.85)" />
          </Pressable>
          <Text style={styles.headerTitle}>Ride Details</Text>
          <Pressable style={styles.iconBtn} hitSlop={10}>
            <Feather name="share-2" size={ms(16)} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        {/* Live route map */}
        <View style={styles.mapCard}>
          <RideMap
            origin={vm.mapOrigin}
            destination={vm.mapDest}
            style={StyleSheet.absoluteFill}
            interactive={false}
          />
          <LinearGradient
            colors={["transparent", "rgba(18,6,12,0.45)"]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.liveTrafficBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live Traffic</Text>
          </View>
        </View>

        {/* Vehicle illustration */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleGlow} />
          <MaterialCommunityIcons name="car-hatchback" size={ms(90)} color={COLORS.fuchsia} />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={["rgba(255,79,154,0.1)", "rgba(255,79,154,0.03)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.summaryRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.topChoiceLabel}>TOP CHOICE</Text>
              <Text style={styles.platformName}>{vm.platform}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.summaryPrice}>{vm.price}</Text>
              <Text style={styles.summaryEta}>{vm.eta}</Text>
            </View>
          </View>
          <View style={styles.chipsRow}>
            {vm.chips.map((chip) => (
              <View key={chip} style={styles.chip}>
                <View style={styles.chipDot} />
                <Text style={styles.chipText}>{chip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Driver / vehicle info */}
        <View>
          <Text style={styles.sectionHeading}>Your Ride Information</Text>
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <MaterialCommunityIcons name="car" size={ms(20)} color="#ffb6d7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{vm.platform}</Text>
              <Text style={styles.driverCategory}>{vm.category}</Text>
            </View>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={ms(12)} color="#f7c35f" />
              <Text style={styles.ratingText}>{vm.rating}</Text>
            </View>
          </View>
        </View>

        {/* Route */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.routeTrack}>
              <View style={styles.routeOriginDot} />
              <View style={styles.routeConnector} />
            </View>
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeValue}>{vm.pickup}</Text>
            </View>
          </View>
          <View style={styles.routeRow}>
            <View style={styles.routeTrack}>
              <View style={styles.routeDestDot} />
            </View>
            <View style={styles.routeContent}>
              <Text style={styles.routeLabel}>DROP-OFF</Text>
              <Text style={styles.routeValue}>{vm.dropoff}</Text>
            </View>
          </View>
        </View>

        <PrimaryButton label={`Open ${vm.platform} →`} onPress={openPlatform} />
      </View>
    </ScreenWrap>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(12),
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: ms(16),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  mapCard: {
    height: ms(190),
    borderRadius: ms(20),
    overflow: "hidden",
    backgroundColor: "#1a0910",
  },
  liveTrafficBadge: {
    position: "absolute",
    top: ms(12),
    left: ms(12),
    flexDirection: "row",
    alignItems: "center",
    gap: ms(6),
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(999),
    backgroundColor: "rgba(18,6,12,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  liveDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: "#34d399",
  },
  liveText: {
    color: "#fff",
    fontSize: ms(10),
    fontWeight: "600",
  },
  vehicleCard: {
    height: ms(120),
    borderRadius: ms(20),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  vehicleGlow: {
    position: "absolute",
    width: ms(160),
    height: ms(160),
    borderRadius: ms(80),
    backgroundColor: COLORS.fuchsia,
    opacity: 0.08,
  },
  summaryCard: {
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    padding: ms(18),
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  topChoiceLabel: {
    color: COLORS.fuchsia,
    fontSize: ms(10),
    letterSpacing: ms(1.5),
    fontWeight: "700",
  },
  platformName: {
    color: "#fff",
    fontSize: ms(20),
    fontWeight: "700",
    marginTop: ms(4),
    letterSpacing: -0.3,
  },
  summaryPrice: {
    color: "#fff",
    fontSize: ms(20),
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  summaryEta: {
    color: COLORS.fuchsia,
    fontSize: ms(11),
    marginTop: ms(4),
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ms(8),
    marginTop: ms(14),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(6),
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(10),
    backgroundColor: COLORS.fuchsiaSoft,
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
  },
  chipDot: {
    width: ms(5),
    height: ms(5),
    borderRadius: ms(3),
    backgroundColor: COLORS.fuchsia,
  },
  chipText: {
    color: "#ffb6d7",
    fontSize: ms(11),
    fontWeight: "600",
  },
  sectionHeading: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "700",
    marginBottom: ms(10),
    letterSpacing: -0.2,
  },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: ms(14),
  },
  driverAvatar: {
    width: ms(46),
    height: ms(46),
    borderRadius: ms(14),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  driverName: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "700",
  },
  driverCategory: {
    color: "rgba(255,255,255,0.45)",
    fontSize: ms(11),
    marginTop: ms(2),
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(5),
    paddingHorizontal: ms(10),
    paddingVertical: ms(6),
    borderRadius: ms(10),
    backgroundColor: "rgba(247,195,95,0.12)",
  },
  ratingText: {
    color: "#f7c35f",
    fontSize: ms(12),
    fontWeight: "700",
  },
  routeCard: {
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: ms(16),
    gap: ms(4),
  },
  routeRow: {
    flexDirection: "row",
    gap: ms(14),
    minHeight: ms(44),
  },
  routeTrack: {
    width: ms(16),
    alignItems: "center",
    paddingTop: ms(4),
  },
  routeOriginDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: COLORS.fuchsia,
  },
  routeConnector: {
    width: 1,
    flex: 1,
    minHeight: ms(20),
    marginTop: ms(4),
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  routeDestDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    borderWidth: 2,
    borderColor: COLORS.fuchsia,
  },
  routeContent: {
    flex: 1,
    paddingBottom: ms(8),
  },
  routeLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: ms(9),
    letterSpacing: ms(1),
    fontWeight: "600",
  },
  routeValue: {
    color: "#fff",
    fontSize: ms(13),
    marginTop: ms(3),
    lineHeight: ms(18),
  },
});

export default RideDetailsScreen;
