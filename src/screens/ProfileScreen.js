/**
 * screens/ProfileScreen.js
 * ─────────────────────────
 * Profile backed by the authenticated user. Ride-preference toggles persist
 * to /users/me; recent history is pulled live; adds a Log Out action. Layout
 * matches the Figma "Profile" frame.
 */
import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { ScreenWrap, BottomNav } from "../components/layout";
import { PrimaryButton, SecondaryButton } from "../components/Button";
import { LoadingState } from "../components/feedback";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";
import { formatCurrency, formatDateTime } from "../utils/format";
import { authService, ridesService } from "../services";
import { useApi } from "../hooks";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "../navigation/routes";

export const ProfileScreen = ({ navigation }) => {
  const { user, logout, setUser } = useAuth();
  const [savingSort, setSavingSort] = useState(false);
  const { data: history, loading: historyLoading } = useApi(
    () => ridesService.getHistory({ limit: 3 }),
    []
  );

  const preferredSort = user?.preferredSort || "cost";

  const setSort = async (sort) => {
    if (sort === preferredSort || savingSort) return;
    setSavingSort(true);
    try {
      const updated = await authService.updateProfile({ preferredSort: sort });
      setUser(updated);
    } catch {
      /* leave previous preference on failure */
    } finally {
      setSavingSort(false);
    }
  };

  const onLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: ROUTES.SPLASH }] });
  };

  return (
    <ScreenWrap title="Profile" footer={<BottomNav navigation={navigation} active="profile" />}>
      <View style={{ gap: ms(16) }}>
        <View style={styles.profileHeader}>
          <View style={commonStyles.profileAvatar}>
            <View style={styles.profileStatus} />
          </View>
          <Text style={styles.profileName}>{user?.fullName || "RideSync User"}</Text>
          <Text style={styles.profileTag}>{(user?.email || "RIDESYNC+").toUpperCase()}</Text>
          <PrimaryButton label="Edit Profile" style={{ marginTop: ms(10), width: ms(140) }} onPress={() => navigation.navigate(ROUTES.EDIT_PROFILE)} />
        </View>

        <View>
          <Text style={commonStyles.listTitle}>Ride Preferences</Text>
          <View style={{ gap: ms(12), marginTop: ms(10) }}>
            <Pressable style={styles.prefRow} onPress={() => setSort("cost")} disabled={savingSort}>
              <View style={styles.prefLeft}>
                <View style={commonStyles.prefIcon}>
                  <MaterialCommunityIcons name="car" size={ms(16)} color="#ffb6d7" />
                </View>
                <Text style={styles.prefLabel}>Prioritize Cost</Text>
              </View>
              <View style={preferredSort === "cost" ? commonStyles.toggleOn : commonStyles.toggleOff}>
                <View style={preferredSort === "cost" ? commonStyles.toggleKnob : commonStyles.toggleKnobOff} />
              </View>
            </Pressable>

            <Pressable style={styles.prefRow} onPress={() => setSort("time")} disabled={savingSort}>
              <View style={styles.prefLeft}>
                <View style={[commonStyles.prefIcon, preferredSort !== "time" && { backgroundColor: "rgba(255,255,255,0.1)" }]}>
                  <Ionicons name="time" size={ms(16)} color={preferredSort === "time" ? "#ffb6d7" : "rgba(255,255,255,0.6)"} />
                </View>
                <Text style={[styles.prefLabel, preferredSort !== "time" && { color: "rgba(255,255,255,0.6)" }]}>Prioritize Time</Text>
              </View>
              <View style={preferredSort === "time" ? commonStyles.toggleOn : commonStyles.toggleOff}>
                <View style={preferredSort === "time" ? commonStyles.toggleKnob : commonStyles.toggleKnobOff} />
              </View>
            </Pressable>
          </View>
        </View>

        <View>
          <View style={commonStyles.rowBetween}>
            <Text style={commonStyles.listTitle}>Recent History</Text>
            <Pressable onPress={() => navigation.navigate(ROUTES.HISTORY)}>
              <Text style={commonStyles.linkText}>View All</Text>
            </Pressable>
          </View>
          <View style={{ gap: ms(12), marginTop: ms(10) }}>
            {historyLoading ? (
              <LoadingState label="Loading…" style={{ paddingVertical: ms(20) }} />
            ) : history && history.length ? (
              history.map((c) => {
                const fares = c.options.map((o) => o.fareEstimate);
                const best = fares.length ? Math.min(...fares) : null;
                return (
                  <View key={c.id} style={commonStyles.listCard}>
                    <View style={commonStyles.listLeft}>
                      <View style={commonStyles.listIcon}>
                        <Ionicons name="location" size={ms(16)} color="#ffb6d7" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={commonStyles.listItemTitle} numberOfLines={1}>
                          {c.originAddress} → {c.destinationAddress}
                        </Text>
                        <Text style={commonStyles.listItemMeta}>{formatDateTime(c.createdAt)}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: "flex-end" }}>
                      <Text style={commonStyles.priceText}>{best != null ? formatCurrency(best) : "—"}</Text>
                      <Text style={commonStyles.listItemMeta}>{c.isSurgeDetected ? "Surge" : "Standard"}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={commonStyles.listItemMeta}>No recent trips yet.</Text>
            )}
          </View>
        </View>

        <SecondaryButton label="Log Out" onPress={onLogout} />
      </View>
    </ScreenWrap>
  );
};

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "center",
  },
  profileStatus: {
    position: "absolute",
    bottom: ms(4),
    right: ms(4),
    width: ms(16),
    height: ms(16),
    borderRadius: ms(8),
    borderWidth: 2,
    borderColor: COLORS.bg,
    backgroundColor: COLORS.fuchsia,
  },
  profileName: {
    marginTop: ms(10),
    color: "#fff",
    fontSize: ms(16),
    fontWeight: "600",
  },
  profileTag: {
    color: COLORS.fuchsia,
    fontSize: ms(10),
    letterSpacing: ms(1),
    fontWeight: "600",
    marginTop: ms(4),
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: ms(18),
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    paddingHorizontal: ms(12),
    paddingVertical: ms(10),
  },
  prefLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(10),
  },
  prefLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: ms(12),
  },
});

export default ProfileScreen;
