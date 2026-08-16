import React, { useState, useRef } from "react";
import { View, Text, Pressable, TextInput, StyleSheet } from "react-native";
import MapView, { Marker, Circle } from "react-native-maps";
import { Feather, Ionicons } from "@expo/vector-icons";

import { ScreenWrap, BottomNav } from "../components/layout";
import { PrimaryButton } from "../components/Button";
import { COLORS } from "../theme/colors";
import { ms } from "../utils/responsive";
import { ROUTES } from "../navigation/routes";
import { useUserLocation } from "../hooks/useUserLocation";
import { useApi } from "../hooks/useApi";
import { analyticsService } from "../services";

// Known Accra demand hotspots for the explore visualization.
const HOTSPOTS = [
  { id: "osu",     lat: 5.5558,  lng: -0.1925, label: "Osu",          color: "#ff4f9a" },
  { id: "airport", lat: 5.6052,  lng: -0.1668, label: "Airport",      color: "#f7c35f" },
  { id: "mall",    lat: 5.6383,  lng: -0.1740, label: "Accra Mall",   color: "#34d399" },
  { id: "labadi",  lat: 5.5562,  lng: -0.1568, label: "Labadi",       color: "#ff4f9a" },
  { id: "circle",  lat: 5.5560,  lng: -0.2074, label: "Kwame Nkrumah", color: "#f7c35f" },
];

export const ExploreScreen = ({ navigation }) => {
  const mapRef                     = useRef(null);
  const { location, loading }      = useUserLocation();
  const [searchText, setSearchText] = useState("");
  const [selectedHotspot, setSelectedHotspot] = useState(null);

  const { data: popularRoutes } = useApi(
    () => analyticsService.getPopularRoutes({ limit: 3 }),
    []
  );

  const center = location ?? { lat: 5.6037, lng: -0.1870 };

  const goToUserLocation = () => {
    if (!mapRef.current || !location) return;
    mapRef.current.animateToRegion(
      { latitude: location.lat, longitude: location.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 },
      600,
    );
  };

  const hotspot = selectedHotspot ?? HOTSPOTS[0];

  return (
    <ScreenWrap
      scroll={false}
      contentStyle={styles.content}
      footer={<BottomNav navigation={navigation} active="map" />}
    >
      {/* ── Full-screen map ─────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType="mutedStandard"
        initialRegion={{
          latitude:      center.lat,
          longitude:     center.lng,
          latitudeDelta: 0.06,
          longitudeDelta: 0.06,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
      >
        {HOTSPOTS.map((h) => (
          <React.Fragment key={h.id}>
            <Circle
              center={{ latitude: h.lat, longitude: h.lng }}
              radius={400}
              fillColor={`${h.color}22`}
              strokeColor={`${h.color}66`}
              strokeWidth={1.5}
            />
            <Marker
              coordinate={{ latitude: h.lat, longitude: h.lng }}
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => setSelectedHotspot(h)}
              tracksViewChanges={false}
            >
              <View style={[styles.hotspotMarker, { borderColor: h.color }]}>
                <View style={[styles.hotspotDot, { backgroundColor: h.color }]} />
              </View>
            </Marker>
          </React.Fragment>
        ))}
      </MapView>

      {/* ── Overlay UI ──────────────────────────────────────────────────── */}

      {/* Top: title pill + search */}
      <View style={styles.topOverlay}>
        <View style={styles.titlePill}>
          <Feather name="map" size={ms(13)} color={COLORS.fuchsia} />
          <Text style={styles.titlePillText}>Explore Ride Conditions</Text>
        </View>
        <View style={styles.searchBar}>
          <Feather name="search" size={ms(14)} color={COLORS.fuchsia} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search area or destination"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText ? (
            <Pressable onPress={() => setSearchText("")} hitSlop={8}>
              <Feather name="x" size={ms(14)} color="rgba(255,255,255,0.5)" />
            </Pressable>
          ) : null}
        </View>
        <View style={styles.chipRow}>
          {["Home", "Work", "Airport"].map((chip) => (
            <Pressable key={chip} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Right: zoom + my-location */}
      <View style={styles.mapControls}>
        <Pressable style={styles.controlBtn} onPress={goToUserLocation}>
          <Ionicons name="locate" size={ms(18)} color={COLORS.fuchsia} />
        </Pressable>
        <Pressable
          style={styles.controlBtn}
          onPress={() => mapRef.current?.getCamera().then((cam) => {
            mapRef.current?.animateCamera({ zoom: (cam.zoom || 14) + 1 }, { duration: 300 });
          })}
        >
          <Feather name="plus" size={ms(18)} color="rgba(255,255,255,0.8)" />
        </Pressable>
        <Pressable
          style={styles.controlBtn}
          onPress={() => mapRef.current?.getCamera().then((cam) => {
            mapRef.current?.animateCamera({ zoom: (cam.zoom || 14) - 1 }, { duration: 300 });
          })}
        >
          <Feather name="minus" size={ms(18)} color="rgba(255,255,255,0.8)" />
        </Pressable>
      </View>

      {/* Bottom: area info card */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View>
            <Text style={styles.infoTitle}>{hotspot.label}</Text>
            <Text style={styles.infoMeta}>
              {popularRoutes?.find((r) =>
                r.originAddress.toLowerCase().includes(hotspot.label.toLowerCase())
              )
                ? "Popular origin point"
                : "Active demand area"}
            </Text>
          </View>
          <View style={[styles.demandBadge, { backgroundColor: `${hotspot.color}22` }]}>
            <View style={[styles.demandDot, { backgroundColor: hotspot.color }]} />
            <Text style={[styles.demandText, { color: hotspot.color }]}>High</Text>
          </View>
        </View>

        {popularRoutes?.length ? (
          <View style={styles.popularRow}>
            <Text style={styles.popularLabel}>Top route:</Text>
            <Text style={styles.popularRoute} numberOfLines={1}>
              {popularRoutes[0].originAddress} → {popularRoutes[0].destinationAddress}
            </Text>
          </View>
        ) : null}

        <PrimaryButton
          label="Compare Rides Here →"
          onPress={() => navigation.navigate(ROUTES.HOME)}
        />
      </View>

      {/* Loading overlay */}
      {loading ? (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingPill}>
            <Feather name="map-pin" size={ms(13)} color={COLORS.fuchsia} />
            <Text style={styles.loadingText}>Getting your location…</Text>
          </View>
        </View>
      ) : null}
    </ScreenWrap>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 0,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },

  // ── Top overlay ──────────────────────────────────────────────────────────
  topOverlay: {
    position: "absolute",
    top: ms(14),
    left: ms(16),
    right: ms(16),
    gap: ms(10),
  },
  titlePill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: ms(6),
    paddingHorizontal: ms(16),
    paddingVertical: ms(8),
    borderRadius: ms(999),
    backgroundColor: "rgba(18,6,12,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  titlePillText: {
    color: "#fff",
    fontSize: ms(12),
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
    paddingHorizontal: ms(14),
    height: ms(48),
    borderRadius: ms(14),
    backgroundColor: "rgba(18,6,12,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: ms(13),
    height: "100%",
  },
  chipRow: {
    flexDirection: "row",
    gap: ms(8),
  },
  chip: {
    paddingHorizontal: ms(14),
    paddingVertical: ms(7),
    borderRadius: ms(999),
    backgroundColor: "rgba(18,6,12,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  chipText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: ms(11),
    fontWeight: "600",
  },

  // ── Map controls ─────────────────────────────────────────────────────────
  mapControls: {
    position: "absolute",
    right: ms(16),
    top: "42%",
    gap: ms(8),
  },
  controlBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    backgroundColor: "rgba(18,6,12,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Bottom info card ─────────────────────────────────────────────────────
  infoCard: {
    position: "absolute",
    bottom: ms(16),
    left: ms(16),
    right: ms(16),
    borderRadius: ms(20),
    backgroundColor: "rgba(18,6,12,0.9)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: ms(16),
    gap: ms(12),
  },
  infoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoTitle: {
    color: "#fff",
    fontSize: ms(16),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  infoMeta: {
    color: "rgba(255,255,255,0.45)",
    fontSize: ms(11),
    marginTop: ms(2),
  },
  demandBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(5),
    paddingHorizontal: ms(10),
    paddingVertical: ms(5),
    borderRadius: ms(8),
  },
  demandDot: {
    width: ms(6),
    height: ms(6),
    borderRadius: ms(3),
  },
  demandText: {
    fontSize: ms(11),
    fontWeight: "700",
  },
  popularRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(6),
  },
  popularLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: ms(11),
    flexShrink: 0,
  },
  popularRoute: {
    color: "rgba(255,255,255,0.75)",
    fontSize: ms(11),
    flex: 1,
  },

  // ── Hotspot markers ──────────────────────────────────────────────────────
  hotspotMarker: {
    width: ms(18),
    height: ms(18),
    borderRadius: ms(9),
    borderWidth: 2,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  hotspotDot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
  },

  // ── Loading overlay ──────────────────────────────────────────────────────
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: ms(120),
    pointerEvents: "none",
  },
  loadingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
    paddingHorizontal: ms(16),
    paddingVertical: ms(10),
    borderRadius: ms(999),
    backgroundColor: "rgba(18,6,12,0.85)",
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
  },
  loadingText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: ms(12),
    fontWeight: "600",
  },
});

export default ExploreScreen;
