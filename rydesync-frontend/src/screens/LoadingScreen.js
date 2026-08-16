import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenWrap } from "../components/layout";
import { COLORS } from "../theme/colors";
import { ms } from "../utils/responsive";

export const LoadingScreen = () => (
  <ScreenWrap scroll={false} contentStyle={styles.content}>
    <View style={styles.glow} pointerEvents="none" />
    <View style={styles.center}>
      <View style={styles.badgeShadow}>
        <LinearGradient
          colors={[COLORS.fuchsiaSoft, "rgba(255,79,154,0.3)"]}
          style={[StyleSheet.absoluteFill, { borderRadius: ms(26) }]}
        />
        <MaterialCommunityIcons name="car" size={ms(44)} color={COLORS.fuchsia} />
      </View>
      <Text style={styles.brandName}>RideSync+</Text>
      <Text style={styles.loadingText}>Finding the best options for you…</Text>
      <View style={styles.dotsRow}>
        {[1, 0.55, 0.25].map((op, i) => (
          <View key={i} style={[styles.dot, { opacity: op }]} />
        ))}
      </View>
    </View>
  </ScreenWrap>
);

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  glow: {
    position: "absolute",
    top: "30%",
    left: "50%",
    marginLeft: ms(-100),
    width: ms(200),
    height: ms(200),
    borderRadius: ms(100),
    backgroundColor: COLORS.fuchsia,
    opacity: 0.1,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: ms(16),
  },
  badgeShadow: {
    width: ms(88),
    height: ms(88),
    borderRadius: ms(26),
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.5,
    shadowRadius: ms(24),
    shadowOffset: { width: 0, height: ms(8) },
  },
  brandName: {
    fontSize: ms(22),
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.4,
  },
  loadingText: {
    fontSize: ms(13),
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
  dotsRow: {
    flexDirection: "row",
    gap: ms(8),
  },
  dot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: COLORS.fuchsia,
  },
});

export default LoadingScreen;
