import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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
    } catch { /* keep previous */ }
    finally { setSavingSort(false); }
  };

  const onLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: ROUTES.SPLASH }] });
  };

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "RS";

  return (
    <ScreenWrap footer={<BottomNav navigation={navigation} active="profile" />}>
      <View style={{ gap: ms(24) }}>

        {/* ── Avatar card ── */}
        <View style={styles.avatarCard}>
          <LinearGradient
            colors={["rgba(255,79,154,0.18)", "rgba(255,79,154,0.04)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
            <View style={styles.avatarStatus} />
          </View>
          <Text style={styles.profileName}>{user?.fullName || "RideSync User"}</Text>
          <Text style={styles.profileEmail}>{user?.email || "—"}</Text>
          <PrimaryButton
            label="Edit Profile"
            style={styles.editBtn}
            onPress={() => navigation.navigate(ROUTES.EDIT_PROFILE)}
          />
        </View>

        {/* ── Ride Preferences ── */}
        <View style={{ gap: ms(12) }}>
          <SectionHeader icon="sliders" label="Ride Preferences" />
          {[
            { key: "cost", label: "Prioritize Cost", icon: "tag" },
            { key: "time", label: "Prioritize Time", icon: "clock" },
          ].map((opt) => {
            const active = preferredSort === opt.key;
            return (
              <Pressable
                key={opt.key}
                style={[styles.prefRow, active && styles.prefRowActive]}
                onPress={() => setSort(opt.key)}
                disabled={savingSort}
              >
                <View style={[styles.prefIcon, active && styles.prefIconActive]}>
                  <Feather name={opt.icon} size={ms(15)} color={active ? "#ffb6d7" : "rgba(255,255,255,0.4)"} />
                </View>
                <Text style={[styles.prefLabel, active && styles.prefLabelActive]}>
                  {opt.label}
                </Text>
                <View style={active ? commonStyles.toggleOn : commonStyles.toggleOff}>
                  <View style={active ? commonStyles.toggleKnob : commonStyles.toggleKnobOff} />
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* ── Recent History ── */}
        <View style={{ gap: ms(12) }}>
          <View style={commonStyles.rowBetween}>
            <SectionHeader icon="clock" label="Recent History" />
            <Pressable onPress={() => navigation.navigate(ROUTES.HISTORY)} hitSlop={8}>
              <Text style={styles.viewAll}>View All →</Text>
            </Pressable>
          </View>

          {historyLoading ? (
            <LoadingState label="Loading…" style={{ paddingVertical: ms(20) }} />
          ) : history?.length ? (
            history.map((c) => {
              const fares = c.options.map((o) => o.fareEstimate);
              const best = fares.length ? Math.min(...fares) : null;
              return (
                <View key={c.id} style={styles.historyCard}>
                  <View style={styles.historyIconWrap}>
                    <Ionicons name="location" size={ms(15)} color="#ffb6d7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyRoute} numberOfLines={1}>
                      {c.originAddress} → {c.destinationAddress}
                    </Text>
                    <Text style={styles.historyMeta}>{formatDateTime(c.createdAt)}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.historyPrice}>
                      {best != null ? formatCurrency(best) : "—"}
                    </Text>
                    <Text style={styles.historyTag}>
                      {c.isSurgeDetected ? "Surge" : "Standard"}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No recent trips yet.</Text>
          )}
        </View>

        <SecondaryButton label="Log Out" onPress={onLogout} />
      </View>
    </ScreenWrap>
  );
};

const SectionHeader = ({ icon, label }) => (
  <View style={{ flexDirection: "row", alignItems: "center", gap: ms(8) }}>
    <View style={sectionStyles.iconWrap}>
      <Feather name={icon} size={ms(13)} color="#ffb6d7" />
    </View>
    <Text style={sectionStyles.label}>{label}</Text>
  </View>
);
const sectionStyles = StyleSheet.create({
  iconWrap: {
    width: ms(26),
    height: ms(26),
    borderRadius: ms(8),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});

const styles = StyleSheet.create({
  avatarCard: {
    borderRadius: ms(24),
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    padding: ms(24),
    alignItems: "center",
    gap: ms(8),
    overflow: "hidden",
  },
  avatarRing: {
    position: "relative",
    width: ms(88),
    height: ms(88),
    borderRadius: ms(44),
    borderWidth: 2,
    borderColor: COLORS.fuchsiaBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: ms(4),
  },
  avatarInner: {
    width: ms(78),
    height: ms(78),
    borderRadius: ms(39),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: COLORS.fuchsia,
    fontSize: ms(26),
    fontWeight: "700",
  },
  avatarStatus: {
    position: "absolute",
    bottom: ms(4),
    right: ms(4),
    width: ms(16),
    height: ms(16),
    borderRadius: ms(8),
    backgroundColor: "#34d399",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  profileName: {
    color: "#fff",
    fontSize: ms(18),
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  profileEmail: {
    color: "rgba(255,255,255,0.45)",
    fontSize: ms(12),
    marginTop: ms(-4),
  },
  editBtn: {
    marginTop: ms(8),
    width: ms(140),
    height: ms(38),
    borderRadius: ms(10),
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: ms(14),
    paddingVertical: ms(12),
  },
  prefRowActive: {
    borderColor: COLORS.fuchsiaBorder,
    backgroundColor: "rgba(255,79,154,0.07)",
  },
  prefIcon: {
    width: ms(34),
    height: ms(34),
    borderRadius: ms(10),
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  prefIconActive: {
    backgroundColor: COLORS.fuchsiaSoft,
  },
  prefLabel: {
    flex: 1,
    color: "rgba(255,255,255,0.55)",
    fontSize: ms(13),
    fontWeight: "600",
  },
  prefLabelActive: {
    color: "#fff",
  },
  viewAll: {
    color: COLORS.fuchsia,
    fontSize: ms(12),
    fontWeight: "600",
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: ms(12),
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: ms(12),
  },
  historyIconWrap: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  historyRoute: {
    color: "#fff",
    fontSize: ms(12),
    fontWeight: "600",
  },
  historyMeta: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(10),
    marginTop: ms(2),
  },
  historyPrice: {
    color: COLORS.fuchsia,
    fontSize: ms(13),
    fontWeight: "700",
  },
  historyTag: {
    color: "rgba(255,255,255,0.35)",
    fontSize: ms(9),
    marginTop: ms(2),
  },
  emptyText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: ms(12),
  },
});

export default ProfileScreen;
