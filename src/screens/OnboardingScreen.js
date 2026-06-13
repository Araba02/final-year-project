/**
 * screens/OnboardingScreen.js
 * ────────────────────────────
 * Reusable onboarding slide template plus the three concrete slides
 * (Compare / Favorites / Insights) wired into the navigator.
 */
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

import { ScreenWrap } from "../components/layout";
import { PrimaryButton } from "../components/Button";
import { HeroCompare, HeroFavorites, HeroInsights } from "../components/hero";
import { COLORS } from "../theme/colors";
import { ms } from "../utils/responsive";
import { ROUTES } from "../navigation/routes";

const HEROES = {
  compare: HeroCompare,
  favorites: HeroFavorites,
  insights: HeroInsights,
};

export const OnboardingTemplate = ({ navigation, title, subtitle, next, buttonLabel, showSkip, hero }) => {
  const Hero = HEROES[hero] || HeroCompare;
  return (
    <ScreenWrap title={null} scroll={false} contentStyle={styles.onboardingContent}>
      <View style={styles.onboardingHeader}>
        <Pressable style={styles.onboardingClose}>
          <Text style={styles.onboardingCloseText}>x</Text>
        </Pressable>
        <Text style={styles.onboardingBrand}>RideSync+</Text>
      </View>
      <View style={styles.onboardingBody}>
        <Hero />
        <Text style={styles.onboardingTitle}>{title}</Text>
        <Text style={styles.onboardingSubtitle}>{subtitle}</Text>
      </View>
      <View style={styles.onboardingFooter}>
        <View style={styles.onboardingDots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <PrimaryButton label={buttonLabel} onPress={() => navigation.navigate(next)} />
        {showSkip ? (
          <Pressable onPress={() => navigation.navigate(ROUTES.LOGIN)}>
            <Text style={styles.skipText}>Skip intro</Text>
          </Pressable>
        ) : null}
      </View>
    </ScreenWrap>
  );
};

export const OnboardingCompare = (props) => (
  <OnboardingTemplate
    {...props}
    title="Compare & Save"
    subtitle="Find the best prices across Uber, Bolt, and Yango in seconds."
    next={ROUTES.ONBOARDING_FAVORITES}
    buttonLabel="Next ->"
    showSkip
    hero="compare"
  />
);

export const OnboardingFavorites = (props) => (
  <OnboardingTemplate
    {...props}
    title="Save Your Favorite Places"
    subtitle="Find the best prices across Uber, Bolt, and Yango in seconds."
    next={ROUTES.ONBOARDING_INSIGHTS}
    buttonLabel="Next ->"
    showSkip
    hero="favorites"
  />
);

export const OnboardingInsights = (props) => (
  <OnboardingTemplate
    {...props}
    title="Make Smarter Travel Decisions"
    subtitle="Find the best prices across Uber, Bolt, and Yango in seconds."
    next={ROUTES.LOGIN}
    buttonLabel="Get Started"
    showSkip={false}
    hero="insights"
  />
);

const styles = StyleSheet.create({
  onboardingContent: {
    paddingHorizontal: ms(24),
    paddingBottom: ms(40),
    justifyContent: "space-between",
    flex: 1,
  },
  onboardingHeader: {
    alignItems: "center",
    justifyContent: "center",
    height: ms(24),
  },
  onboardingClose: {
    position: "absolute",
    left: 0,
  },
  onboardingCloseText: {
    color: COLORS.fuchsia,
    fontSize: ms(18),
  },
  onboardingBrand: {
    color: "rgba(255,255,255,0.8)",
    fontSize: ms(11),
    fontWeight: "600",
  },
  onboardingBody: {
    alignItems: "center",
  },
  onboardingTitle: {
    marginTop: ms(24),
    fontSize: ms(22),
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  onboardingSubtitle: {
    marginTop: ms(8),
    fontSize: ms(11),
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    maxWidth: ms(240),
  },
  onboardingFooter: {
    alignItems: "center",
    gap: ms(12),
  },
  onboardingDots: {
    flexDirection: "row",
    gap: ms(8),
  },
  dot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    width: ms(24),
    backgroundColor: COLORS.fuchsia,
  },
  skipText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: ms(10),
  },
});

export default OnboardingTemplate;
