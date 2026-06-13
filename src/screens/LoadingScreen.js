/**
 * screens/LoadingScreen.js
 * ─────────────────────────
 * Branded loading state while ride options sync.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ScreenWrap } from "../components/layout";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
import { ms } from "../utils/responsive";

export const LoadingScreen = () => (
  <ScreenWrap title="RideSync+" scroll={false}>
    <View style={commonStyles.centered}>
      <View style={styles.loadingBadge}>
        <MaterialCommunityIcons name="car" size={ms(38)} color={COLORS.fuchsia} />
      </View>
      <Text style={styles.loadingTitle}>RideSync+</Text>
      <View style={styles.loadingDots}>
        <View style={[styles.loadingDot, { backgroundColor: COLORS.fuchsia }]} />
        <View style={[styles.loadingDot, { backgroundColor: "rgba(255,79,154,0.6)" }]} />
        <View style={[styles.loadingDot, { backgroundColor: "rgba(255,79,154,0.3)" }]} />
      </View>
      <Text style={styles.loadingText}>Syncing ride options...</Text>
    </View>
  </ScreenWrap>
);

const styles = StyleSheet.create({
  loadingBadge: {
    width: ms(80),
    height: ms(80),
    borderRadius: ms(24),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.3,
    shadowRadius: ms(16),
    shadowOffset: { width: 0, height: ms(8) },
  },
  loadingTitle: {
    fontSize: ms(18),
    fontWeight: "600",
    color: "#fff",
  },
  loadingDots: {
    flexDirection: "row",
    gap: ms(8),
  },
  loadingDot: {
    width: ms(10),
    height: ms(10),
    borderRadius: ms(5),
  },
  loadingText: {
    fontSize: ms(12),
    color: "rgba(255,255,255,0.5)",
  },
});

export default LoadingScreen;
