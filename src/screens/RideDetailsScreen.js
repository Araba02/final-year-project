/**
 * screens/RideDetailsScreen.js
 * ─────────────────────────────
 * Selected-ride detail (Figma "Ride Details" layout) populated from the live
 * comparison option passed via route params. "Continue to App" opens the
 * chosen platform via its deep link. Falls back to demo data if opened
 * without params.
 */
import React from "react";
import { View, Text, Pressable, Image, Linking, Alert, StyleSheet } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { ScreenWrap } from "../components/layout";
import { PrimaryButton } from "../components/Button";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { mapPhoto } from "../constants/assets";
import { RIDE_DETAILS } from "../constants/mockData";
import { ROUTES } from "../navigation/routes";

function buildViewModel(params) {
  const { option, comparison } = params;
  if (option) {
    const chips = [option.rideCategory, `${option.driversNearby} nearby`];
    if (option.isSurge) chips.push(`${option.surgeMultiplier}x surge`);
    return {
      platform: option.platformLabel,
      category: option.rideCategory,
      price: option.priceLabel,
      eta: `${option.eta} min away`,
      rating: Number(option.driverRating).toFixed(1),
      chips,
      pickup: comparison?.originAddress || "Your pickup",
      dropoff: comparison?.destinationAddress || "Your destination",
      deepLink: option.deepLinkUrl,
    };
  }
  // Fallback demo content.
  return {
    platform: RIDE_DETAILS.platform,
    category: RIDE_DETAILS.platform,
    price: RIDE_DETAILS.price,
    eta: RIDE_DETAILS.eta,
    rating: RIDE_DETAILS.driver.rating,
    chips: RIDE_DETAILS.chips,
    pickup: RIDE_DETAILS.pickup,
    dropoff: RIDE_DETAILS.dropoff,
    deepLink: null,
  };
}

export const RideDetailsScreen = ({ navigation, route }) => {
  const vm = buildViewModel(route?.params || {});

  const openPlatform = async () => {
    if (!vm.deepLink) {
      navigation.navigate(ROUTES.HOME);
      return;
    }
    try {
      const supported = await Linking.canOpenURL(vm.deepLink);
      if (supported) await Linking.openURL(vm.deepLink);
      else Alert.alert(`Open ${vm.platform}`, `Install the ${vm.platform} app to continue your booking.`);
    } catch {
      Alert.alert("Couldn't open the app", "Please open your ride-hailing app manually.");
    }
  };

  return (
    <ScreenWrap title={null}>
      <View style={{ gap: ms(16) }}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
            <Feather name="chevron-left" size={ms(22)} color={COLORS.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Ride Details</Text>
          <Pressable hitSlop={10}>
            <Feather name="share-2" size={ms(18)} color={COLORS.text} />
          </Pressable>
        </View>

        {/* Live map */}
        <View style={styles.mapCard}>
          <Image source={mapPhoto} style={commonStyles.mapImage} resizeMode="cover" />
          <View style={commonStyles.mapOverlay} />
          <View style={styles.liveTrafficBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTrafficText}>Live Traffic</Text>
          </View>
        </View>

        {/* Vehicle illustration */}
        <View style={styles.vehicleCard}>
          <MaterialCommunityIcons name="car-hatchback" size={ms(96)} color={COLORS.fuchsia} />
        </View>

        {/* Top-choice summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.topChoiceLabel}>TOP CHOICE</Text>
              <Text style={styles.platformName}>{vm.platform}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={styles.summaryPrice}>{vm.price}</Text>
              <Text style={styles.summaryEta}>{vm.eta}</Text>
            </View>
          </View>
          <View style={styles.chipRow}>
            {vm.chips.map((chip) => (
              <View key={chip} style={styles.detailChip}>
                <View style={styles.detailChipDot} />
                <Text style={styles.detailChipText}>{chip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Ride information */}
        <View>
          <Text style={styles.sectionHeading}>Your Ride Information</Text>
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <MaterialCommunityIcons name="car" size={ms(20)} color="#ffb6d7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{vm.platform}</Text>
              <Text style={styles.driverMeta}>{vm.category}</Text>
            </View>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={ms(11)} color="#f7c35f" />
              <Text style={styles.ratingText}>{vm.rating}</Text>
            </View>
          </View>
        </View>

        {/* Pickup / drop-off */}
        <View style={styles.routeCard}>
          <View style={styles.routeRow}>
            <View style={styles.routeIndicator}>
              <Ionicons name="location" size={ms(14)} color={COLORS.fuchsia} />
              <View style={styles.routeConnector} />
            </View>
            <View style={styles.routeTextWrap}>
              <Text style={styles.routeLabel}>PICKUP</Text>
              <Text style={styles.routeValue}>{vm.pickup}</Text>
            </View>
          </View>
          <View style={styles.routeRow}>
            <View style={styles.routeIndicator}>
              <View style={styles.routeEndDot} />
            </View>
            <View style={styles.routeTextWrap}>
              <Text style={styles.routeLabel}>DROP-OFF</Text>
              <Text style={styles.routeValue}>{vm.dropoff}</Text>
            </View>
          </View>
        </View>

        <PrimaryButton label={`Open ${vm.platform} ->`} onPress={openPlatform} />
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
  headerTitle: {
    color: "#fff",
    fontSize: ms(15),
    fontWeight: "600",
  },
  mapCard: {
    height: ms(160),
    borderRadius: ms(20),
    overflow: "hidden",
    position: "relative",
  },
  liveTrafficBadge: {
    position: "absolute",
    top: ms(12),
    left: ms(12),
    flexDirection: "row",
    alignItems: "center",
    gap: ms(6),
    paddingHorizontal: ms(10),
    paddingVertical: ms(5),
    borderRadius: ms(999),
    backgroundColor: "rgba(18,6,12,0.7)",
  },
  liveDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: COLORS.fuchsia,
  },
  liveTrafficText: {
    color: "#fff",
    fontSize: ms(9),
    fontWeight: "600",
  },
  vehicleCard: {
    height: ms(120),
    borderRadius: ms(20),
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryCard: {
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: ms(16),
  },
  summaryTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  topChoiceLabel: {
    color: COLORS.fuchsia,
    fontSize: ms(9),
    letterSpacing: ms(2),
    fontWeight: "700",
  },
  platformName: {
    color: "#fff",
    fontSize: ms(18),
    fontWeight: "700",
    marginTop: ms(4),
  },
  summaryPrice: {
    color: "#fff",
    fontSize: ms(18),
    fontWeight: "700",
  },
  summaryEta: {
    color: COLORS.fuchsia,
    fontSize: ms(10),
    marginTop: ms(4),
  },
  chipRow: {
    flexDirection: "row",
    gap: ms(8),
    marginTop: ms(14),
    flexWrap: "wrap",
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(6),
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(999),
    backgroundColor: COLORS.fuchsiaSoft,
  },
  detailChipDot: {
    width: ms(5),
    height: ms(5),
    borderRadius: ms(3),
    backgroundColor: COLORS.fuchsia,
  },
  detailChipText: {
    color: "#ffb6d7",
    fontSize: ms(10),
    fontWeight: "600",
  },
  sectionHeading: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "600",
    marginBottom: ms(10),
  },
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
    borderRadius: ms(18),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: ms(12),
  },
  driverAvatar: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  driverName: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "600",
  },
  driverMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(10),
    marginTop: ms(2),
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(4),
  },
  ratingText: {
    color: "#f7c35f",
    fontSize: ms(11),
    fontWeight: "600",
  },
  routeCard: {
    borderRadius: ms(18),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    padding: ms(16),
  },
  routeRow: {
    flexDirection: "row",
    gap: ms(12),
  },
  routeIndicator: {
    width: ms(16),
    alignItems: "center",
  },
  routeConnector: {
    width: 1,
    flex: 1,
    minHeight: ms(22),
    marginTop: ms(2),
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  routeEndDot: {
    width: ms(12),
    height: ms(12),
    borderRadius: ms(6),
    borderWidth: 2,
    borderColor: COLORS.fuchsia,
    marginTop: ms(2),
  },
  routeTextWrap: {
    flex: 1,
    paddingBottom: ms(14),
  },
  routeLabel: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(9),
    letterSpacing: ms(1),
    fontWeight: "600",
  },
  routeValue: {
    color: "#fff",
    fontSize: ms(12),
    marginTop: ms(3),
  },
});

export default RideDetailsScreen;
