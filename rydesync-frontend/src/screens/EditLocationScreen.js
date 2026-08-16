/**
 * EditLocationScreen
 * ──────────────────
 * Interactive location picker with a "floating pin" pattern:
 *   - The map pans freely beneath a fixed crosshair pin.
 *   - On pan-end, reverse-geocodes the new centre to get an address.
 *   - On save, persists to /users/me/saved-places via the API.
 */
import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import MapView from "react-native-maps";
import * as Location from "expo-location";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenWrap } from "../components/layout";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { COLORS } from "../theme/colors";
import { ms } from "../utils/responsive";
import { useUserLocation } from "../hooks/useUserLocation";
import { savedPlacesService } from "../services";
import { ROUTES } from "../navigation/routes";

const LABEL_ICONS = [
  { key: "home",      icon: "home" },
  { key: "work",      icon: "briefcase" },
  { key: "gym",       icon: "activity" },
  { key: "map-pin",   icon: "map-pin" },
];

export const EditLocationScreen = ({ navigation, route }) => {
  const existingPlace  = route?.params?.place ?? null;
  const { location }   = useUserLocation();

  const mapRef = useRef(null);

  const [label, setLabel]           = useState(existingPlace?.label ?? "");
  const [address, setAddress]       = useState(existingPlace?.address ?? "");
  const [selectedIcon, setIcon]     = useState(existingPlace?.icon ?? "map-pin");
  const [coords, setCoords]         = useState(
    existingPlace?.lat
      ? { lat: existingPlace.lat, lng: existingPlace.lng }
      : null
  );
  const [geocoding, setGeocoding]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);

  const center = coords ?? location ?? { lat: 5.6037, lng: -0.1870 };

  // Called when user lifts their finger after panning — reverse-geocode centre.
  const onRegionChangeComplete = useCallback(async (region) => {
    const newCoords = { lat: region.latitude, lng: region.lng ?? region.longitude };
    setCoords(newCoords);
    setGeocoding(true);
    try {
      const [result] = await Location.reverseGeocodeAsync({
        latitude:  region.latitude,
        longitude: region.longitude,
      });
      if (result) {
        const parts = [
          result.street,
          result.district || result.subregion,
          result.city,
          result.country,
        ].filter(Boolean);
        setAddress(parts.join(", "));
      }
    } catch {
      // Keep whatever address was there before
    } finally {
      setGeocoding(false);
    }
  }, []);

  const onSave = async () => {
    setError(null);
    if (!label.trim()) { setError("Please enter a label (e.g. Home)."); return; }
    if (!address.trim()) { setError("Move the map to choose a location."); return; }
    setSaving(true);
    try {
      if (existingPlace?.id) {
        // Optimistic: delete old and re-add with updated values
        await savedPlacesService.remove(existingPlace.id);
      }
      await savedPlacesService.add({
        label:   label.trim(),
        address: address.trim(),
        icon:    selectedIcon,
        lat:     coords?.lat ?? null,
        lng:     coords?.lng ?? null,
      });
      navigation.goBack();
    } catch (err) {
      setError(err?.message || "Couldn't save this location. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const goToUserLocation = () => {
    if (!mapRef.current || !location) return;
    mapRef.current.animateToRegion(
      { latitude: location.lat, longitude: location.lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      500,
    );
  };

  return (
    <ScreenWrap scroll={false} contentStyle={styles.content}>
      {/* ── Full-screen map ─────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        mapType="mutedStandard"
        initialRegion={{
          latitude:      center.lat,
          longitude:     center.lng,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        onRegionChangeComplete={onRegionChangeComplete}
      />

      {/* Gradient darken at top and bottom for readability */}
      <LinearGradient
        colors={["rgba(18,6,12,0.72)", "transparent"]}
        style={styles.topGradient}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(18,6,12,0.82)"]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* ── Fixed crosshair pin ─────────────────────────────────────────── */}
      <View style={styles.pinWrap} pointerEvents="none">
        <View style={styles.pinHead}>
          <Ionicons name="location" size={ms(28)} color={COLORS.fuchsia} />
        </View>
        <View style={styles.pinShadow} />
      </View>

      {/* ── Top: back button + title ─────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.goBack()} style={styles.topBtn} hitSlop={10}>
          <Feather name="chevron-left" size={ms(20)} color="#fff" />
        </Pressable>
        <View style={styles.topTitle}>
          <Text style={styles.topTitleText}>
            {existingPlace ? "Edit Place" : "Add Place"}
          </Text>
          <Text style={styles.topTitleSub}>Pan the map to choose a spot</Text>
        </View>
        <Pressable onPress={goToUserLocation} style={styles.topBtn} hitSlop={10}>
          <Ionicons name="locate" size={ms(18)} color={COLORS.fuchsia} />
        </Pressable>
      </View>

      {/* ── Bottom form panel ────────────────────────────────────────────── */}
      <View style={styles.panel}>
        {/* Address preview */}
        <View style={styles.addressRow}>
          <View style={styles.addressIcon}>
            <Ionicons name="location" size={ms(15)} color={COLORS.fuchsia} />
          </View>
          <View style={{ flex: 1 }}>
            {geocoding ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: ms(8) }}>
                <ActivityIndicator size="small" color={COLORS.fuchsia} />
                <Text style={styles.addressGeocode}>Getting address…</Text>
              </View>
            ) : (
              <Text style={styles.addressText} numberOfLines={2}>
                {address || "Pan the map to select a location"}
              </Text>
            )}
          </View>
        </View>

        {/* Label input */}
        <View style={styles.labelRow}>
          <View style={styles.inputWrap}>
            <Feather name="tag" size={ms(15)} color="rgba(255,255,255,0.3)" style={styles.inputIcon} />
            <TextInput
              style={styles.inputField}
              placeholder="Label (e.g. Home, Work)"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={label}
              onChangeText={setLabel}
              returnKeyType="done"
            />
          </View>
        </View>

        {/* Icon picker */}
        <View style={styles.iconRow}>
          {LABEL_ICONS.map((item) => (
            <Pressable
              key={item.key}
              onPress={() => setIcon(item.key)}
              style={[
                styles.iconChip,
                selectedIcon === item.key && styles.iconChipActive,
              ]}
            >
              <Feather
                name={item.icon}
                size={ms(16)}
                color={selectedIcon === item.key ? COLORS.fuchsia : "rgba(255,255,255,0.4)"}
              />
            </Pressable>
          ))}
        </View>

        {error ? (
          <View style={styles.errorRow}>
            <Feather name="alert-circle" size={ms(13)} color="#ffb6d7" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.actions}>
          <SecondaryButton
            label="Cancel"
            style={{ flex: 1 }}
            onPress={() => navigation.goBack()}
          />
          {saving ? (
            <View style={[styles.savingBtn, { flex: 2 }]}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <PrimaryButton
              label="Save Place"
              style={{ flex: 2 }}
              onPress={onSave}
            />
          )}
        </View>
      </View>
    </ScreenWrap>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 0,
  },

  // ── Top gradient + bar ───────────────────────────────────────────────────
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: ms(120),
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: ms(340),
  },
  topBar: {
    position: "absolute",
    top: ms(14),
    left: ms(16),
    right: ms(16),
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
  },
  topBtn: {
    width: ms(40),
    height: ms(40),
    borderRadius: ms(12),
    backgroundColor: "rgba(18,6,12,0.75)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    flex: 1,
    alignItems: "center",
  },
  topTitleText: {
    color: "#fff",
    fontSize: ms(15),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  topTitleSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: ms(11),
    marginTop: ms(2),
  },

  // ── Fixed crosshair pin ──────────────────────────────────────────────────
  pinWrap: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: ms(-16),
    marginTop: ms(-44),
    alignItems: "center",
  },
  pinHead: {
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.6,
    shadowRadius: ms(10),
    shadowOffset: { width: 0, height: ms(2) },
  },
  pinShadow: {
    width: ms(8),
    height: ms(4),
    borderRadius: ms(4),
    backgroundColor: "rgba(0,0,0,0.3)",
    marginTop: ms(2),
  },

  // ── Bottom panel ─────────────────────────────────────────────────────────
  panel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius:  ms(24),
    borderTopRightRadius: ms(24),
    backgroundColor: "#12060c",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: ms(20),
    paddingTop: ms(20),
    paddingBottom: ms(36),
    gap: ms(14),
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: ms(12),
  },
  addressIcon: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
    marginTop: ms(2),
  },
  addressText: {
    color: "#fff",
    fontSize: ms(13),
    lineHeight: ms(19),
    fontWeight: "500",
  },
  addressGeocode: {
    color: "rgba(255,255,255,0.45)",
    fontSize: ms(13),
  },
  labelRow: {
    gap: ms(6),
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    height: ms(50),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: ms(14),
    gap: ms(10),
  },
  inputIcon: {
    width: ms(18),
    textAlign: "center",
  },
  inputField: {
    flex: 1,
    color: "#fff",
    fontSize: ms(14),
    height: "100%",
  },
  iconRow: {
    flexDirection: "row",
    gap: ms(10),
  },
  iconChip: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconChipActive: {
    borderColor: COLORS.fuchsiaBorder,
    backgroundColor: COLORS.fuchsiaSoft,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
  },
  errorText: {
    color: "#ffb6d7",
    fontSize: ms(12),
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: ms(12),
  },
  savingBtn: {
    height: ms(48),
    borderRadius: ms(14),
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default EditLocationScreen;
