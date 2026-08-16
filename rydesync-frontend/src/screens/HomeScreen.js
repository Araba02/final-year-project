import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";

import { ScreenWrap, BottomNav } from "../components/layout";
import { RideMap } from "../components/map";
import { PrimaryButton } from "../components/Button";
import { LocationSearchModal } from "../components/location";
import { LoadingState, EmptyState } from "../components/feedback";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { ROUTES } from "../navigation/routes";
import { useAuth } from "../context/AuthContext";
import { useRideCompareForm } from "../hooks";
import { useUserLocation } from "../hooks/useUserLocation";
import { useApi } from "../hooks/useApi";
import { ridesService } from "../services";
import { formatCurrency, formatDateTime } from "../utils/format";

export const HomeScreen = ({ navigation }) => {
  const { user }      = useAuth();
  const firstName     = user?.fullName?.split(" ")[0] || "there";
  const { location }  = useUserLocation();

  const {
    origin, destination,
    setOrigin, setDestination,
    comparing, error, submit,
  } = useRideCompareForm();

  const [picking, setPicking] = useState(null);

  // Derive "recent places" from the last 10 comparisons
  const { data: history, loading: historyLoading } = useApi(
    () => ridesService.getHistory({ limit: 10 }),
    []
  );

  const recentPlaces = React.useMemo(() => {
    if (!history?.length) return [];
    const seen = new Set();
    const out  = [];
    for (const c of history) {
      const key = c.destinationAddress;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({
          id:      c.id,
          title:   c.destinationAddress,
          meta:    formatDateTime(c.createdAt),
          lat:     c.destinationLat,
          lng:     c.destinationLng,
          icon:    "map-pin",
        });
      }
      if (out.length >= 3) break;
    }
    return out;
  }, [history]);

  const onSelectLocation = (loc) => {
    if (picking === "origin")      setOrigin(loc);
    else if (picking === "destination") setDestination(loc);
  };

  const mapOrigin      = origin      ? { lat: origin.lat,      lng: origin.lng }      : null;
  const mapDestination = destination ? { lat: destination.lat, lng: destination.lng } : null;

  const headerContent = (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.brandBadge}>
          <MaterialCommunityIcons name="car" size={ms(16)} color="#ffb6d7" />
        </View>
        <Text style={styles.brandName}>RideSync+</Text>
      </View>
      <Pressable
        style={styles.avatar}
        onPress={() => navigation.navigate(ROUTES.PROFILE)}
        hitSlop={8}
      >
        <Text style={styles.avatarInitials}>
          {user?.fullName?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "RS"}
        </Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenWrap
      header={headerContent}
      footer={<BottomNav navigation={navigation} active="home" />}
    >
      <View style={{ gap: ms(16) }}>
        {/* Greeting */}
        <Text style={commonStyles.homeGreeting}>
          Where to,{" "}
          <Text style={{ color: COLORS.fuchsia }}>{firstName}</Text>?
        </Text>

        {/* Location inputs */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionLabel}>PICKUP</Text>
          <Pressable
            style={commonStyles.inputPill}
            onPress={() => setPicking("origin")}
          >
            <View style={commonStyles.pillIcon}>
              <Feather name="circle" size={ms(14)} color="#ffb6d7" />
            </View>
            <Text
              style={[commonStyles.pillText, !origin && styles.placeholder]}
              numberOfLines={1}
            >
              {origin?.address || (location ? "Use current location" : "Set pickup location")}
            </Text>
            {location && !origin ? (
              <View style={styles.liveTag}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            ) : null}
          </Pressable>

          <Text style={[commonStyles.sectionLabel, { marginTop: ms(14) }]}>DESTINATION</Text>
          <Pressable
            style={commonStyles.inputPill}
            onPress={() => setPicking("destination")}
          >
            <View style={[commonStyles.pillIcon, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
              <Feather name="map-pin" size={ms(14)} color="rgba(255,255,255,0.5)" />
            </View>
            <Text
              style={[commonStyles.pillText, !destination && styles.placeholder]}
              numberOfLines={1}
            >
              {destination?.address || "Where are you heading?"}
            </Text>
          </Pressable>

          {error ? (
            <View style={styles.errorRow}>
              <Feather name="alert-circle" size={ms(13)} color="#ffb6d7" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: ms(16) }}>
            {comparing ? (
              <View style={styles.comparing}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.comparingText}>Comparing rides…</Text>
              </View>
            ) : (
              <PrimaryButton
                label="Compare Rides →"
                onPress={() => {
                  // If no origin set, auto-use GPS location
                  if (!origin && location) {
                    setOrigin({ address: "Current Location", lat: location.lat, lng: location.lng });
                  }
                  submit(navigation);
                }}
              />
            )}
          </View>
        </View>

        {/* Live map preview */}
        <View style={styles.mapCard}>
          <RideMap
            origin={mapOrigin}
            destination={mapDestination}
            userLocation={location}
            style={StyleSheet.absoluteFill}
            interactive={false}
          />
          <View style={styles.mapGradient} />
          {location ? (
            <View style={styles.locationBadge}>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>Live location active</Text>
            </View>
          ) : null}
        </View>

        {/* Recent places */}
        <View style={commonStyles.rowBetween}>
          <Text style={commonStyles.listTitle}>Recent Places</Text>
          <Pressable onPress={() => navigation.navigate(ROUTES.HISTORY)} hitSlop={8}>
            <Text style={commonStyles.linkText}>See all</Text>
          </Pressable>
        </View>

        {historyLoading ? (
          <LoadingState label="Loading recent places…" style={{ paddingVertical: ms(12) }} />
        ) : recentPlaces.length === 0 ? (
          <EmptyState
            icon="map"
            title="No recent places"
            message="Your recent destinations will appear here after your first ride search."
          />
        ) : (
          recentPlaces.map((place) => (
            <Pressable
              key={place.id}
              style={commonStyles.listCard}
              onPress={() => {
                setDestination({ address: place.title, lat: place.lat, lng: place.lng });
              }}
            >
              <View style={commonStyles.listLeft}>
                <View style={commonStyles.listIcon}>
                  <Feather name={place.icon} size={ms(16)} color="#ffb6d7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={commonStyles.listItemTitle} numberOfLines={1}>
                    {place.title}
                  </Text>
                  <Text style={commonStyles.listItemMeta}>{place.meta}</Text>
                </View>
              </View>
              <Feather name="chevron-right" size={ms(16)} color="rgba(255,255,255,0.3)" />
            </Pressable>
          ))
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
  },
  brandBadge: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(10),
    backgroundColor: COLORS.fuchsiaSoft,
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: {
    color: "#fff",
    fontWeight: "700",
    fontSize: ms(15),
    letterSpacing: 0.3,
  },
  avatar: {
    width: ms(38),
    height: ms(38),
    borderRadius: ms(19),
    backgroundColor: COLORS.fuchsiaSoft,
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: COLORS.fuchsia,
    fontSize: ms(12),
    fontWeight: "700",
  },
  placeholder: {
    color: "rgba(255,255,255,0.4)",
  },
  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(4),
    paddingHorizontal: ms(8),
    paddingVertical: ms(3),
    borderRadius: ms(6),
    backgroundColor: "rgba(52,211,153,0.15)",
  },
  liveDot: {
    width: ms(5),
    height: ms(5),
    borderRadius: ms(3),
    backgroundColor: "#34d399",
  },
  liveText: {
    color: "#34d399",
    fontSize: ms(9),
    fontWeight: "700",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(6),
    marginTop: ms(10),
  },
  errorText: {
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
    height: ms(190),
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
  locationBadge: {
    position: "absolute",
    top: ms(12),
    right: ms(12),
    flexDirection: "row",
    alignItems: "center",
    gap: ms(5),
    paddingHorizontal: ms(10),
    paddingVertical: ms(5),
    borderRadius: ms(999),
    backgroundColor: "rgba(18,6,12,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  locationDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
    backgroundColor: "#34d399",
  },
  locationText: {
    color: "#fff",
    fontSize: ms(10),
    fontWeight: "600",
  },
});

export default HomeScreen;
