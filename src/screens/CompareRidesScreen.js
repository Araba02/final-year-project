/**
 * screens/CompareRidesScreen.js
 * ──────────────────────────────
 * Compare-rides entry variant (map inside a card). Interactive pickup/
 * destination + live /rides/compare, same as Home. Layout unchanged.
 */
import React, { useState } from "react";
import { View, Text, Pressable, Image, ActivityIndicator, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenWrap, BottomNav } from "../components/layout";
import { PrimaryButton } from "../components/Button";
import { LocationSearchModal } from "../components/location";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { mapPhoto } from "../constants/assets";
import { SAVED_LOCATIONS } from "../constants/mockData";
import { ROUTES } from "../navigation/routes";
import { useAuth } from "../context/AuthContext";
import { useRideCompareForm } from "../hooks";

export const CompareRidesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] || "there";
  const { origin, destination, setOrigin, setDestination, comparing, error, submit } = useRideCompareForm();
  const [picking, setPicking] = useState(null);

  const onSelectLocation = (loc) => {
    if (picking === "origin") setOrigin(loc);
    else if (picking === "destination") setDestination(loc);
  };

  return (
    <ScreenWrap title="RideSync+" footer={<BottomNav navigation={navigation} active="home" />}>
      <View style={{ gap: ms(16) }}>
        <Text style={commonStyles.homeGreeting}>
          Where to, <Text style={{ color: COLORS.fuchsia }}>{firstName}</Text>?
        </Text>

        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionLabel}>PICKUP</Text>
          <Pressable style={commonStyles.inputPill} onPress={() => setPicking("origin")}>
            <View style={commonStyles.pillIcon}>
              <Text style={commonStyles.pillIconText}>O</Text>
            </View>
            <Text style={[commonStyles.pillText, !origin && styles.placeholder]} numberOfLines={1}>
              {origin?.address || "Set pickup location"}
            </Text>
          </Pressable>

          <Text style={[commonStyles.sectionLabel, { marginTop: ms(14) }]}>DESTINATION</Text>
          <Pressable style={commonStyles.inputPill} onPress={() => setPicking("destination")}>
            <View style={[commonStyles.pillIcon, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
              <Text style={[commonStyles.pillIconText, { color: "rgba(255,255,255,0.6)" }]}>X</Text>
            </View>
            <Text style={[commonStyles.pillText, !destination && styles.placeholder]} numberOfLines={1}>
              {destination?.address || "Where are you heading?"}
            </Text>
          </Pressable>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={{ marginTop: ms(16) }}>
            {comparing ? (
              <View style={styles.comparing}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.comparingText}>Comparing rides…</Text>
              </View>
            ) : (
              <PrimaryButton label="Compare Rides ->" onPress={() => submit(navigation)} />
            )}
          </View>
        </View>

        <View style={commonStyles.card}>
          <View style={commonStyles.mapCard}>
            <Image source={mapPhoto} style={commonStyles.mapImage} resizeMode="cover" />
            <View style={commonStyles.mapOverlay} />
          </View>
        </View>

        <View style={commonStyles.rowBetween}>
          <Text style={commonStyles.listTitle}>Saved Location</Text>
          <Text style={commonStyles.linkText}>Clear all</Text>
        </View>
        {SAVED_LOCATIONS.map((item) => (
          <Pressable key={item.title} onPress={() => navigation.navigate(ROUTES.EDIT_LOCATION)} style={commonStyles.listCard}>
            <View style={commonStyles.listLeft}>
              <View style={commonStyles.listIcon}>
                <Feather name={item.icon} size={ms(16)} color="#ffb6d7" />
              </View>
              <View>
                <Text style={commonStyles.listItemTitle}>{item.title}</Text>
                <Text style={commonStyles.listItemMeta}>{item.meta}</Text>
              </View>
            </View>
            <Text style={commonStyles.listArrow}>&gt;</Text>
          </Pressable>
        ))}
      </View>

      <LocationSearchModal
        visible={picking !== null}
        title={picking === "origin" ? "Set pickup" : "Set destination"}
        onClose={() => setPicking(null)}
        onSelect={onSelectLocation}
      />
    </ScreenWrap>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    color: "rgba(255,255,255,0.5)",
  },
  error: {
    color: "#ffd2e7",
    fontSize: ms(11),
    marginTop: ms(10),
  },
  comparing: {
    height: ms(44),
    borderRadius: ms(999),
    backgroundColor: COLORS.fuchsia,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ms(8),
  },
  comparingText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: ms(13),
  },
});

export default CompareRidesScreen;
