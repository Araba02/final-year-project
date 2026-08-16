import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { ScreenWrap } from "../components/layout";
import { PrimaryButton } from "../components/Button";
import { COLORS } from "../theme/colors";
import { ms } from "../utils/responsive";
import { ROUTES } from "../navigation/routes";
import { useAuth } from "../context/AuthContext";

export const SplashScreen = ({ navigation }) => {
  const { isAuthenticated, isBootstrapping } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigation.reset({ index: 0, routes: [{ name: ROUTES.HOME }] });
    }
  }, [isAuthenticated, navigation]);

  return (
    <ScreenWrap scroll={false} contentStyle={styles.content}>
      {/* Ambient glows */}
      <View style={styles.glow1} pointerEvents="none" />
      <View style={styles.glow2} pointerEvents="none" />

      <View style={styles.layout}>
        {/* Brand */}
        <View style={styles.brandSection}>
          <View style={styles.logoBadge}>
            <LinearGradient
              colors={[COLORS.fuchsiaSoft, "rgba(255,79,154,0.35)"]}
              style={StyleSheet.absoluteFill}
            />
            <MaterialCommunityIcons name="car" size={ms(40)} color={COLORS.fuchsia} />
          </View>
          <Text style={styles.brandName}>RideSync+</Text>
          <Text style={styles.tagline}>{"Ride smarter.\nSave on every trip."}</Text>
          <Text style={styles.subTagline}>
            Compare Uber, Bolt & Yango prices{"\n"}in seconds — all in one place.
          </Text>
        </View>

        {/* CTA */}
        <View style={styles.ctaSection}>
          {isBootstrapping || isAuthenticated ? (
            <View style={styles.loadingDots}>
              <View style={[styles.dot, { backgroundColor: COLORS.fuchsia }]} />
              <View style={[styles.dot, { backgroundColor: "rgba(255,79,154,0.5)" }]} />
              <View style={[styles.dot, { backgroundColor: "rgba(255,79,154,0.25)" }]} />
            </View>
          ) : (
            <>
              <PrimaryButton
                label="Get Started"
                onPress={() => navigation.navigate(ROUTES.ONBOARDING_COMPARE)}
              />
              <View style={styles.loginRow}>
                <Text style={styles.loginPrompt}>Already have an account?  </Text>
                <Text
                  style={styles.loginLink}
                  onPress={() => navigation.navigate(ROUTES.LOGIN)}
                >
                  Login
                </Text>
              </View>
            </>
          )}
        </View>
      </View>
    </ScreenWrap>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingBottom: ms(36),
  },
  layout: {
    flex: 1,
    justifyContent: "space-between",
  },
  glow1: {
    position: "absolute",
    top: ms(-80),
    right: ms(-80),
    width: ms(300),
    height: ms(300),
    borderRadius: ms(150),
    backgroundColor: COLORS.fuchsia,
    opacity: 0.1,
  },
  glow2: {
    position: "absolute",
    bottom: ms(100),
    left: ms(-100),
    width: ms(220),
    height: ms(220),
    borderRadius: ms(110),
    backgroundColor: COLORS.fuchsia,
    opacity: 0.06,
  },
  brandSection: {
    alignItems: "center",
    paddingTop: ms(60),
    gap: ms(16),
  },
  logoBadge: {
    width: ms(90),
    height: ms(90),
    borderRadius: ms(26),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.fuchsiaBorder,
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.5,
    shadowRadius: ms(24),
    shadowOffset: { width: 0, height: ms(10) },
  },
  brandName: {
    fontSize: ms(28),
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -0.5,
    marginTop: ms(4),
  },
  tagline: {
    fontSize: ms(32),
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    lineHeight: ms(38),
    letterSpacing: -0.8,
    marginTop: ms(8),
  },
  subTagline: {
    fontSize: ms(13),
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
    lineHeight: ms(20),
  },
  ctaSection: {
    gap: ms(16),
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  loginPrompt: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(13),
  },
  loginLink: {
    color: COLORS.fuchsia,
    fontSize: ms(13),
    fontWeight: "700",
  },
  loadingDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: ms(8),
    paddingVertical: ms(16),
  },
  dot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
  },
});

export default SplashScreen;
