import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenWrap, BottomNav } from "../components/layout";
import { PrimaryButton } from "../components/Button";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { authService, savedPlacesService } from "../services";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../navigation/routes";

const RIDE_PRIORITIES = [
  { key: "cost",   label: "Cheapest", icon: "tag" },
  { key: "time",   label: "Fastest",  icon: "zap" },
  { key: "rating", label: "Top Rated", icon: "star" },
];

const Field = ({ label, icon, style, ...props }) => (
  <View style={{ gap: ms(6) }}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={[styles.inputWrap, style]}>
      {icon ? (
        <Feather name={icon} size={ms(15)} color="rgba(255,255,255,0.28)" style={styles.inputIcon} />
      ) : null}
      <TextInput
        style={styles.inputField}
        placeholderTextColor="rgba(255,255,255,0.28)"
        {...props}
      />
    </View>
  </View>
);

export const EditProfileScreen = ({ navigation }) => {
  const { user, setUser } = useAuth();
  const [fullName, setFullName]             = useState(user?.fullName || "");
  const [preferredSort, setPreferredSort]   = useState(user?.preferredSort || "cost");
  const [surgeAlerts, setSurgeAlerts]       = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState(null);
  const [removingId, setRemovingId]         = useState(null);

  const {
    data: savedPlaces,
    loading: placesLoading,
    refetch: refetchPlaces,
  } = useApi(() => savedPlacesService.list(), []);

  const handleRemovePlace = async (placeId) => {
    setRemovingId(placeId);
    try {
      await savedPlacesService.remove(placeId);
      refetchPlaces();
    } catch { /* ignore */ }
    finally { setRemovingId(null); }
  };

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "RS";

  const onSave = async () => {
    setError(null);
    if (!fullName.trim()) { setError("Your name can't be empty."); return; }
    setSaving(true);
    try {
      const updated = await authService.updateProfile({ fullName: fullName.trim(), preferredSort });
      setUser(updated);
      navigation.goBack();
    } catch (err) {
      setError(err?.message || "Couldn't save changes. Please try again.");
    } finally { setSaving(false); }
  };

  return (
    <ScreenWrap footer={<BottomNav navigation={navigation} active="profile" />}>
      <View style={{ gap: ms(22) }}>

        {/* ── Header ── */}
        <View style={commonStyles.rowCenter}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
            <Feather name="chevron-left" size={ms(22)} color="rgba(255,255,255,0.8)" />
          </Pressable>
          <Text style={styles.screenTitle}>Edit Profile</Text>
        </View>

        {/* ── Avatar ── */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            <LinearGradient
              colors={[COLORS.fuchsiaSoft, "rgba(255,79,154,0.3)"]}
              style={[StyleSheet.absoluteFill, { borderRadius: ms(42) }]}
            />
            <Text style={styles.avatarInitials}>{initials}</Text>
            <View style={styles.editBadge}>
              <Feather name="camera" size={ms(10)} color="#fff" />
            </View>
          </View>
          <View style={{ alignItems: "center", gap: ms(2) }}>
            <Text style={styles.avatarName}>{user?.fullName || "RideSync User"}</Text>
            <Text style={styles.avatarEmail}>{user?.email}</Text>
          </View>
        </View>

        {/* ── Personal info ── */}
        <View style={styles.card}>
          <View style={commonStyles.rowCenter}>
            <View style={styles.sectionIconWrap}>
              <Feather name="user" size={ms(13)} color="#ffb6d7" />
            </View>
            <Text style={styles.cardTitle}>Personal Info</Text>
          </View>
          <View style={{ gap: ms(14), marginTop: ms(16) }}>
            <Field
              label="Full Name"
              icon="user"
              value={fullName}
              onChangeText={setFullName}
              editable={!saving}
              returnKeyType="next"
            />
            <Field
              label="Email Address"
              icon="mail"
              value={user?.email || ""}
              style={styles.readonlyField}
              editable={false}
            />
            <View style={{ gap: ms(6) }}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryPill}>
                  <Text style={styles.flag}>🇬🇭</Text>
                  <Text style={styles.countryCode}>+233</Text>
                </View>
                <View style={[styles.inputWrap, { flex: 1 }]}>
                  <Feather name="phone" size={ms(15)} color="rgba(255,255,255,0.28)" style={styles.inputIcon} />
                  <TextInput
                    defaultValue="24 123 4567"
                    style={styles.inputField}
                    placeholderTextColor="rgba(255,255,255,0.28)"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Preferences ── */}
        <View style={styles.card}>
          <View style={commonStyles.rowCenter}>
            <View style={styles.sectionIconWrap}>
              <Feather name="sliders" size={ms(13)} color="#ffb6d7" />
            </View>
            <Text style={styles.cardTitle}>Preferences</Text>
          </View>

          <View style={{ marginTop: ms(16), gap: ms(10) }}>
            <Text style={styles.prefSectionLabel}>Ride Priority</Text>
            <View style={styles.priorityRow}>
              {RIDE_PRIORITIES.map((opt) => {
                const active = opt.key === preferredSort;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => setPreferredSort(opt.key)}
                    style={[styles.priorityChip, active && styles.priorityChipActive]}
                  >
                    <Feather
                      name={opt.icon}
                      size={ms(12)}
                      color={active ? COLORS.fuchsia : "rgba(255,255,255,0.35)"}
                    />
                    <Text style={[styles.priorityChipText, active && styles.priorityChipTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <Pressable style={styles.surgeRow} onPress={() => setSurgeAlerts((v) => !v)}>
            <View style={styles.surgeLeft}>
              <View style={[styles.sectionIconWrap, { backgroundColor: "rgba(251,191,36,0.15)" }]}>
                <Feather name="zap" size={ms(13)} color="#fbbf24" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.surgeTitle}>Surge Alerts</Text>
                <Text style={styles.surgeMeta}>Get notified when prices drop below surge</Text>
              </View>
            </View>
            <View style={surgeAlerts ? commonStyles.toggleOn : commonStyles.toggleOff}>
              <View style={surgeAlerts ? commonStyles.toggleKnob : commonStyles.toggleKnobOff} />
            </View>
          </Pressable>
        </View>

        {/* ── Saved places ── */}
        <View style={styles.card}>
          <View style={commonStyles.rowBetween}>
            <View style={commonStyles.rowCenter}>
              <View style={styles.sectionIconWrap}>
                <Feather name="map-pin" size={ms(13)} color="#ffb6d7" />
              </View>
              <Text style={styles.cardTitle}>Saved Places</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate(ROUTES.EDIT_LOCATION)}
              style={styles.addNewBtn}
              hitSlop={8}
            >
              <Feather name="plus" size={ms(13)} color={COLORS.fuchsia} />
              <Text style={styles.addNewText}>Add New</Text>
            </Pressable>
          </View>

          <View style={{ gap: ms(10), marginTop: ms(14) }}>
            {placesLoading ? (
              <ActivityIndicator color={COLORS.fuchsia} style={{ paddingVertical: ms(8) }} />
            ) : savedPlaces?.length ? (
              savedPlaces.map((place) => (
                <View key={place.id} style={styles.placeRow}>
                  <View style={styles.placeIcon}>
                    <Feather name={place.icon || "map-pin"} size={ms(14)} color="#ffb6d7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.placeLabel}>{place.label}</Text>
                    <Text style={styles.placeAddress} numberOfLines={1}>{place.address}</Text>
                  </View>
                  <View style={styles.placeActions}>
                    <Pressable
                      onPress={() => navigation.navigate(ROUTES.EDIT_LOCATION, { place })}
                      hitSlop={8}
                      style={styles.placeActionBtn}
                    >
                      <Feather name="edit-2" size={ms(14)} color="rgba(255,255,255,0.45)" />
                    </Pressable>
                    <Pressable
                      onPress={() => handleRemovePlace(place.id)}
                      hitSlop={8}
                      style={styles.placeActionBtn}
                      disabled={removingId === place.id}
                    >
                      {removingId === place.id ? (
                        <ActivityIndicator size="small" color="rgba(255,255,255,0.35)" />
                      ) : (
                        <Feather name="trash-2" size={ms(14)} color="rgba(255,255,255,0.35)" />
                      )}
                    </Pressable>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: ms(12) }}>
                No saved places yet — tap "Add New" to save a location.
              </Text>
            )}
          </View>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={ms(14)} color="#ffb6d7" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {saving ? (
          <View style={styles.savingBtn}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : (
          <PrimaryButton label="Save Changes" onPress={onSave} />
        )}
      </View>
    </ScreenWrap>
  );
};

const styles = StyleSheet.create({
  screenTitle: {
    color: "#fff",
    fontSize: ms(20),
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  avatarSection: {
    alignItems: "center",
    gap: ms(12),
  },
  avatarRing: {
    width: ms(84),
    height: ms(84),
    borderRadius: ms(42),
    borderWidth: 2,
    borderColor: COLORS.fuchsiaBorder,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarInitials: {
    color: COLORS.fuchsia,
    fontSize: ms(28),
    fontWeight: "700",
  },
  editBadge: {
    position: "absolute",
    bottom: ms(0),
    right: ms(0),
    width: ms(26),
    height: ms(26),
    borderRadius: ms(13),
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  avatarName: {
    color: "#fff",
    fontSize: ms(16),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  avatarEmail: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(12),
  },
  card: {
    borderRadius: ms(20),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: ms(16),
  },
  sectionIconWrap: {
    width: ms(28),
    height: ms(28),
    borderRadius: ms(8),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  fieldLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: ms(11),
    fontWeight: "600",
    letterSpacing: ms(0.5),
    textTransform: "uppercase",
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
  readonlyField: {
    opacity: 0.5,
  },
  phoneRow: {
    flexDirection: "row",
    gap: ms(10),
    alignItems: "stretch",
  },
  countryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(6),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: ms(12),
  },
  flag: {
    fontSize: ms(16),
  },
  countryCode: {
    color: "#fff",
    fontSize: ms(13),
  },
  prefSectionLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(11),
    fontWeight: "600",
  },
  priorityRow: {
    flexDirection: "row",
    gap: ms(8),
  },
  priorityChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ms(5),
    paddingVertical: ms(9),
    borderRadius: ms(10),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  priorityChipActive: {
    borderColor: COLORS.fuchsiaBorder,
    backgroundColor: COLORS.fuchsiaSoft,
  },
  priorityChipText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(11),
    fontWeight: "600",
  },
  priorityChipTextActive: {
    color: COLORS.fuchsia,
  },
  surgeRow: {
    marginTop: ms(16),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ms(12),
  },
  surgeLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
    flex: 1,
  },
  surgeTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: ms(13),
    fontWeight: "600",
  },
  surgeMeta: {
    color: "rgba(255,255,255,0.35)",
    fontSize: ms(11),
    marginTop: ms(2),
  },
  addNewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(4),
  },
  addNewText: {
    color: COLORS.fuchsia,
    fontSize: ms(12),
    fontWeight: "600",
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
  },
  placeIcon: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(10),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  placeLabel: {
    color: "#fff",
    fontSize: ms(13),
    fontWeight: "600",
  },
  placeAddress: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(11),
    marginTop: ms(2),
  },
  placeActions: {
    flexDirection: "row",
    gap: ms(4),
  },
  placeActionBtn: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(8),
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
    borderRadius: ms(12),
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    backgroundColor: "rgba(255,79,154,0.1)",
    paddingHorizontal: ms(14),
    paddingVertical: ms(10),
  },
  errorText: {
    color: "#ffb6d7",
    fontSize: ms(12),
    flex: 1,
  },
  savingBtn: {
    height: ms(48),
    borderRadius: ms(14),
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default EditProfileScreen;
