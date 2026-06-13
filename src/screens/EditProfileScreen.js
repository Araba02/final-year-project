/**
 * screens/EditProfileScreen.js
 * ─────────────────────────────
 * Edit profile (Figma "Edit Profile" frame) wired to /users/me. Full name and
 * ride priority persist to the backend; email is read-only (backend does not
 * allow email change); Surge Alerts + Saved Places remain client-side for now.
 */
import React, { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenWrap, BottomNav } from "../components/layout";
import { PrimaryButton } from "../components/Button";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { SAVED_PLACES } from "../constants/mockData";
import { authService } from "../services";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../navigation/routes";

const RIDE_PRIORITIES = [
  { key: "cost", label: "Cheapest" },
  { key: "time", label: "Fastest" },
  { key: "rating", label: "Top Rated" },
];

export const EditProfileScreen = ({ navigation }) => {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [preferredSort, setPreferredSort] = useState(user?.preferredSort || "cost");
  const [surgeAlerts, setSurgeAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const onSave = async () => {
    setError(null);
    if (!fullName.trim()) {
      setError("Your name can't be empty.");
      return;
    }
    setSaving(true);
    try {
      const updated = await authService.updateProfile({ fullName: fullName.trim(), preferredSort });
      setUser(updated);
      navigation.goBack();
    } catch (err) {
      setError(err?.message || "Couldn't save your changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrap title="Edit Profile" footer={<BottomNav navigation={navigation} active="profile" />}>
      <View style={{ gap: ms(16) }}>
        <View style={commonStyles.rowCenter}>
          <Text style={commonStyles.backArrow}>&lt;-</Text>
          <Text style={commonStyles.sectionTitleSmall}>Edit Profile</Text>
        </View>

        <View style={commonStyles.card}>
          <View style={styles.profileEditHeader}>
            <View style={commonStyles.profileAvatar}>
              <View style={styles.profileEditBadge}>
                <Text style={styles.profileEditBadgeText}>EDIT</Text>
              </View>
            </View>
            <Text style={commonStyles.listItemTitle}>{user?.fullName || "RideSync User"}</Text>
            <Text style={commonStyles.listItemMeta}>{user?.email}</Text>
          </View>

          <View style={{ gap: ms(12), marginTop: ms(12) }}>
            <View>
              <Text style={commonStyles.sectionLabel}>FULL NAME</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                style={commonStyles.input}
                placeholderTextColor="rgba(255,255,255,0.4)"
                editable={!saving}
              />
            </View>
            <View>
              <Text style={commonStyles.sectionLabel}>EMAIL ADDRESS</Text>
              <TextInput
                value={user?.email || ""}
                style={[commonStyles.input, styles.readonly]}
                editable={false}
              />
            </View>
            <View>
              <Text style={commonStyles.sectionLabel}>PHONE NUMBER</Text>
              <View style={styles.phoneRow}>
                <View style={styles.countryPill}>
                  <Text style={styles.countryFlag}>🇬🇭</Text>
                  <Text style={styles.countryCode}>+233</Text>
                </View>
                <TextInput
                  defaultValue="24 123 4567"
                  style={[commonStyles.input, styles.phoneInput]}
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>
        </View>

        <View style={commonStyles.card}>
          <View style={commonStyles.rowCenter}>
            <Feather name="sliders" size={ms(14)} color="#ffb6d7" />
            <Text style={commonStyles.sectionTitleSmall}>Preferences</Text>
          </View>

          <Text style={[commonStyles.smallText, { marginTop: ms(12) }]}>Ride Priority</Text>
          <View style={styles.priorityRow}>
            {RIDE_PRIORITIES.map((opt) => {
              const active = opt.key === preferredSort;
              return (
                <Pressable key={opt.key} onPress={() => setPreferredSort(opt.key)} style={active ? commonStyles.chipActive : commonStyles.chip}>
                  <Text style={active ? commonStyles.chipActiveText : commonStyles.chipText}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.surgeRow} onPress={() => setSurgeAlerts((v) => !v)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.surgeTitle}>Surge Alerts</Text>
              <Text style={styles.surgeMeta}>Alerts when prices drop below surge</Text>
            </View>
            <View style={surgeAlerts ? commonStyles.toggleOn : commonStyles.toggleOff}>
              <View style={surgeAlerts ? commonStyles.toggleKnob : commonStyles.toggleKnobOff} />
            </View>
          </Pressable>

          <View style={[commonStyles.rowBetween, { marginTop: ms(16) }]}>
            <Text style={commonStyles.sectionTitleSmall}>Saved Places</Text>
            <Pressable onPress={() => navigation.navigate(ROUTES.EDIT_LOCATION)} style={styles.addNew} hitSlop={8}>
              <Feather name="plus" size={ms(12)} color={COLORS.fuchsia} />
              <Text style={commonStyles.linkText}>Add New</Text>
            </Pressable>
          </View>
          <View style={{ gap: ms(10), marginTop: ms(10) }}>
            {SAVED_PLACES.map((place) => (
              <View key={place.label} style={styles.placeRow}>
                <View style={commonStyles.listLeft}>
                  <View style={styles.placeIcon}>
                    <Feather name={place.icon} size={ms(15)} color="#ffb6d7" />
                  </View>
                  <View>
                    <Text style={commonStyles.listItemTitle}>{place.label}</Text>
                    <Text style={commonStyles.listItemMeta}>{place.address}</Text>
                  </View>
                </View>
                <View style={styles.placeActions}>
                  <Pressable onPress={() => navigation.navigate(ROUTES.EDIT_LOCATION)} hitSlop={8}>
                    <Feather name="edit-2" size={ms(15)} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                  <Pressable hitSlop={8}>
                    <Feather name="trash-2" size={ms(15)} color="rgba(255,255,255,0.6)" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {saving ? (
          <View style={styles.saving}>
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
  profileEditHeader: {
    alignItems: "center",
  },
  profileEditBadge: {
    position: "absolute",
    bottom: ms(-4),
    right: ms(-4),
    width: ms(26),
    height: ms(26),
    borderRadius: ms(13),
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center",
  },
  profileEditBadgeText: {
    fontSize: ms(8),
    color: "#fff",
    fontWeight: "600",
  },
  readonly: {
    opacity: 0.6,
  },
  phoneRow: {
    flexDirection: "row",
    gap: ms(8),
    marginTop: ms(2),
  },
  countryPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(6),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: ms(18),
    paddingHorizontal: ms(14),
  },
  countryFlag: {
    fontSize: ms(14),
  },
  countryCode: {
    color: "#fff",
    fontSize: ms(14),
  },
  phoneInput: {
    flex: 1,
  },
  priorityRow: {
    flexDirection: "row",
    gap: ms(8),
    marginTop: ms(8),
  },
  surgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: ms(16),
  },
  surgeTitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: ms(12),
    fontWeight: "600",
  },
  surgeMeta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(9),
    marginTop: ms(2),
  },
  addNew: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(4),
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: ms(16),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
  },
  placeIcon: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(18),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  placeActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(14),
  },
  error: {
    color: "#ffd2e7",
    fontSize: ms(11),
  },
  saving: {
    height: ms(44),
    borderRadius: ms(999),
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default EditProfileScreen;
