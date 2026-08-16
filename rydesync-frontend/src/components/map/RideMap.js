/**
 * components/map/RideMap.js
 * ──────────────────────────
 * Reusable MapView wrapper used across Home, Explore, RideDetails and
 * EditLocation.  Uses Apple Maps on iOS (no API key required in development).
 *
 * Props:
 *   origin       { lat, lng } | null  – pickup marker
 *   destination  { lat, lng } | null  – drop-off marker
 *   userLocation { lat, lng } | null  – used for initial camera only;
 *                                       showsUserLocation handles the live dot
 *   style        ViewStyle            – applied to MapView (fills parent)
 *   interactive  bool (default true)  – disables scroll/zoom for preview cards
 *   onRegionChange (region) => void   – optional, used by EditLocationScreen
 *   children     ReactNode            – extra Markers/Circles from the caller
 */
import React, { useRef, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";

import { COLORS } from "../../theme/colors";
import { ms } from "../../utils/responsive";
import { ACCRA } from "../../hooks/useUserLocation";

const DEFAULT_DELTA = { latitudeDelta: 0.06, longitudeDelta: 0.06 };
const TIGHT_DELTA   = { latitudeDelta: 0.02, longitudeDelta: 0.02 };
const EDGE_PADDING  = { top: 70, right: 50, bottom: 70, left: 50 };

export const RideMap = ({
  origin,
  destination,
  userLocation,
  style,
  interactive = true,
  onRegionChange,
  children,
}) => {
  const mapRef = useRef(null);

  // Auto-fit camera to encompass origin, destination, and user location.
  useEffect(() => {
    if (!mapRef.current) return;
    const coords = [];
    if (origin)       coords.push({ latitude: origin.lat,       longitude: origin.lng });
    if (destination)  coords.push({ latitude: destination.lat,  longitude: destination.lng });
    if (userLocation) coords.push({ latitude: userLocation.lat, longitude: userLocation.lng });

    if (coords.length >= 2) {
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: EDGE_PADDING,
        animated: true,
      });
    } else if (coords.length === 1) {
      mapRef.current.animateToRegion(
        { latitude: coords[0].latitude, longitude: coords[0].longitude, ...TIGHT_DELTA },
        400,
      );
    }
  }, [origin, destination, userLocation]);

  const center = userLocation ?? ACCRA;
  const initialRegion = {
    latitude:  center.lat,
    longitude: center.lng,
    ...DEFAULT_DELTA,
  };

  return (
    <MapView
      ref={mapRef}
      style={[styles.map, style]}
      initialRegion={initialRegion}
      mapType="mutedStandard"
      showsUserLocation={true}
      showsMyLocationButton={false}
      showsCompass={false}
      showsScale={false}
      toolbarEnabled={false}
      scrollEnabled={interactive}
      zoomEnabled={interactive}
      rotateEnabled={false}
      pitchEnabled={false}
      onRegionChangeComplete={onRegionChange}
    >
      {/* ── Origin marker ───────────────────────────────────────────────── */}
      {origin ? (
        <Marker
          coordinate={{ latitude: origin.lat, longitude: origin.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
          tracksViewChanges={false}
        >
          <View style={styles.originOuter}>
            <View style={styles.originInner} />
          </View>
        </Marker>
      ) : null}

      {/* ── Destination marker ───────────────────────────────────────────── */}
      {destination ? (
        <Marker
          coordinate={{ latitude: destination.lat, longitude: destination.lng }}
          anchor={{ x: 0.5, y: 1 }}
          tracksViewChanges={false}
        >
          <View style={styles.destWrap}>
            <View style={styles.destHead} />
            <View style={styles.destStem} />
          </View>
        </Marker>
      ) : null}

      {/* ── Route polyline ───────────────────────────────────────────────── */}
      {origin && destination ? (
        <Polyline
          coordinates={[
            { latitude: origin.lat,      longitude: origin.lng },
            { latitude: destination.lat, longitude: destination.lng },
          ]}
          strokeColor={COLORS.fuchsia}
          strokeWidth={ms(3)}
          lineDashPattern={[ms(10), ms(5)]}
        />
      ) : null}

      {children}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },

  // ── Origin: concentric fuchsia rings ─────────────────────────────────────
  originOuter: {
    width: ms(22),
    height: ms(22),
    borderRadius: ms(11),
    backgroundColor: "rgba(255,79,154,0.25)",
    borderWidth: 2,
    borderColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center",
  },
  originInner: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
    backgroundColor: COLORS.fuchsia,
  },

  // ── Destination: teardrop pin ────────────────────────────────────────────
  destWrap: {
    alignItems: "center",
  },
  destHead: {
    width: ms(24),
    height: ms(24),
    borderRadius: ms(12),
    backgroundColor: COLORS.fuchsia,
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.5,
    shadowRadius: ms(6),
    shadowOffset: { width: 0, height: ms(2) },
  },
  destStem: {
    width: ms(3),
    height: ms(10),
    backgroundColor: COLORS.fuchsia,
    borderBottomLeftRadius: ms(2),
    borderBottomRightRadius: ms(2),
  },
});

export default RideMap;
