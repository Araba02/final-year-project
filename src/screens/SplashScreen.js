/**
 * screens/SplashScreen.js
 * ────────────────────────
 * App entry splash. Doubles as the auth gate: while the session is being
 * restored it shows a spinner; an authenticated user is sent straight to
 * Home, otherwise the "Get Started" onboarding CTA is shown.
 */
import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ScreenWrap } from "../components/layout";
import { PrimaryButton } from "../components/Button";
import { COLORS } from "../theme/colors";
import { commonStyles } from "../theme/commonStyles";
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
    <ScreenWrap title="RideSync+" scroll={false}>
      <View style={commonStyles.centered}>
        <View style={styles.logoBadge}>
          <MaterialCommunityIcons name="car" size={ms(32)} color={COLORS.fuchsia} />
        </View>
        <Text style={styles.splashTitle}>RideSync+</Text>
        <Text style={styles.splashSubtitle}>Smart ride matching in your city.</Text>
        <View style={{ width: "100%", marginTop: ms(30) }}>
          {isBootstrapping || isAuthenticated ? (
            <ActivityIndicator color={COLORS.fuchsia} />
          ) : (
            <PrimaryButton label="Get Started" onPress={() => navigation.navigate(ROUTES.ONBOARDING_COMPARE)} />
          )}
        </View>
      </View>
    </ScreenWrap>
  );
};

const styles = StyleSheet.create({
  logoBadge: {
    width: ms(64),
    height: ms(64),
    borderRadius: ms(16),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.35,
    shadowRadius: ms(14),
    shadowOffset: { width: 0, height: ms(8) },
  },
  splashTitle: {
    fontSize: ms(22),
    fontWeight: "600",
    color: "#fff",
  },
  splashSubtitle: {
    fontSize: ms(12),
    color: "rgba(255,255,255,0.6)",
  },
});

export default SplashScreen;
