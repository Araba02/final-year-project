/**
 * screens/CompareRidesScreen.js
 * ──────────────────────────────
 * Compare-rides entry variant (map inside a card). Interactive pickup/
 * destination + live /rides/compare, same as Home. Layout unchanged.
 */
import React, { useState } from "react";
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenWrap, BottomNav } from "../components/layout";
import { RideMap } from "../components/map";
import { PrimaryButton } from "../components/Button";
import { LocationSearchModal } from "../components/location";
import { LoadingState } from "../components/feedback";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { ROUTES } from "../navigation/routes";
import { useAuth } from "../context/AuthContext";
import { useRideCompareForm } from "../hooks";
import { useApi } from "../hooks/useApi";
import { useUserLocation } from "../hooks/useUserLocation";
import { savedPlacesService } from "../services";

export const CompareRidesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const firstName = user?.fullName?.split(" ")[0] || "there";
  const { location } = useUserLocation();
  const { origin, destination, setOrigin, setDestination, comparing, error, submit } = useRideCompareForm();
  const [picking, setPicking] = useState(null);

  const { data: savedPlaces, loading: placesLoading } = useApi(
    () => savedPlacesService.list(),
    []
  );

  const onSelectLocation = (loc) => {
    if (picking === "origin") setOrigin(loc);
    else if (picking === "destination") setDestination(loc);
  };

  const mapOrigin      = origin      ? { lat: origin.lat,      lng: origin.lng }      : null;
  const mapDestination = destination ? { lat: destination.lat, lng: destination.lng } : null;

  return (
    <ScreenWrap
      header={
        <Text style={commonStyles.homeGreeting}>
          Where to, <Text style={{ color: COLORS.fuchsia }}>{firstName}</Text>?
        </Text>
      }
      footer={<BottomNav navigation={navigation} active="home" />}
    >
      <View style={{ gap: ms(16) }}>

        {/* Route input card */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionLabel}>PICKUP</Text>
          <Pressable style={commonStyles.inputPill} onPress={() => setPicking("origin")}>
            <View style={commonStyles.pillIcon}>
              <Feather name="circle" size={ms(14)} color="#ffb6d7" />
            </View>
            <Text style={[commonStyles.pillText, !origin && styles.placeholder]} numberOfLines={1}>
              {origin?.address || "Set pickup location"}
            </Text>
          </Pressable>

          <Text style={[commonStyles.sectionLabel, { marginTop: ms(14) }]}>DESTINATION</Text>
          <Pressable style={commonStyles.inputPill} onPress={() => setPicking("destination")}>
            <View style={[commonStyles.pillIcon, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
              <Feather name="map-pin" size={ms(14)} color="rgba(255,255,255,0.5)" />
            </View>
            <Text style={[commonStyles.pillText, !destination && styles.placeholder]} numberOfLines={1}>
              {destination?.address || "Where are you heading?"}
            </Text>
          </Pressable>

          {error ? (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={ms(13)} color="#ffb6d7" />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: ms(16) }}>
            {comparing ? (
              <View style={styles.comparing}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.comparingText}>Comparing rides…</Text>
              </View>
            ) : (
              <PrimaryButton label="Compare Rides →" onPress={() => submit(navigation)} />
            )}
          </View>
        </View>

        {/* Live route map preview */}
        <View style={styles.mapCard}>
          <RideMap
            origin={mapOrigin}
            destination={mapDestination}
            userLocation={location}
            style={StyleSheet.absoluteFill}
            interactive={false}
          />
          <View style={styles.mapGradient} />
        </View>

        {/* Saved places */}
        <View style={commonStyles.rowBetween}>
          <Text style={commonStyles.listTitle}>Saved Places</Text>
          <Pressable onPress={() => navigation.navigate(ROUTES.EDIT_LOCATION)} hitSlop={8}>
            <Text style={commonStyles.linkText}>+ Add</Text>
          </Pressable>
        </View>

        {placesLoading ? (
          <LoadingState label="Loading saved places…" style={{ paddingVertical: ms(12) }} />
        ) : savedPlaces?.length ? (
          savedPlaces.map((place) => (
            <Pressable
              key={place.id}
              style={commonStyles.listCard}
              onPress={() => {
                setDestination({ address: place.address, lat: place.lat, lng: place.lng });
              }}
            >
              <View style={commonStyles.listLeft}>
                <View style={commonStyles.listIcon}>
                  <Feather name={place.icon || "map-pin"} size={ms(16)} color="#ffb6d7" />
                </View>
                <View>
                  <Text style={commonStyles.listItemTitle}>{place.label}</Text>
                  <Text style={commonStyles.listItemMeta} numberOfLines={1}>{place.address}</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={ms(16)} color="rgba(255,255,255,0.3)" />
            </Pressable>
          ))
        ) : (
          <Pressable
            style={styles.emptyPlaces}
            onPress={() => navigation.navigate(ROUTES.EDIT_LOCATION)}
          >
            <Feather name="plus-circle" size={ms(18)} color={COLORS.fuchsia} />
            <Text style={styles.emptyPlacesText}>Save a home or work address for quick access</Text>
          </Pressable>
        )}
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
    color: "rgba(255,255,255,0.4)",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(6),
    marginTop: ms(10),
  },
  error: {
    color: "#ffd2e7",
    fontSize: ms(11),
    flex: 1,
  },
  comparing: {
    height: ms(48),
    borderRadius: ms(14),
    backgroundColor: COLORS.fuchsia,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ms(10),
  },
  comparingText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: ms(13),
  },
  mapCard: {
    height: ms(180),
    borderRadius: ms(20),
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#1a0910",
  },
  mapGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,79,154,0.06)",
    pointerEvents: "none",
  },
  emptyPlaces: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    backgroundColor: COLORS.fuchsiaSoft,
    padding: ms(14),
  },
  emptyPlacesText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: ms(12),
    flex: 1,
  },
});

export default CompareRidesScreen;
