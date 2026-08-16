import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

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

const SLIDE_INDEX = {
  compare: 0,
  favorites: 1,
  insights: 2,
};

export const OnboardingTemplate = ({
  navigation,
  title,
  subtitle,
  next,
  buttonLabel,
  showSkip,
  hero,
}) => {
  const Hero = HEROES[hero] || HeroCompare;
  const activeIndex = SLIDE_INDEX[hero] ?? 0;

  return (
    <ScreenWrap scroll={false} contentStyle={styles.content}>
      {/* Header row */}
      <View style={styles.header}>
        <Pressable
          style={styles.closeBtn}
          onPress={() => navigation.navigate(ROUTES.LOGIN)}
          hitSlop={12}
        >
          <Feather name="x" size={ms(18)} color="rgba(255,255,255,0.5)" />
        </Pressable>
        <Text style={styles.brandLabel}>RideSync+</Text>
        {showSkip ? (
          <Pressable onPress={() => navigation.navigate(ROUTES.LOGIN)} hitSlop={10}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : (
          <View style={{ width: ms(36) }} />
        )}
      </View>

      {/* Hero illustration */}
      <View style={styles.heroSection}>
        <Hero />
      </View>

      {/* Text */}
      <View style={styles.textSection}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
        <PrimaryButton label={buttonLabel} onPress={() => navigation.navigate(next)} />
      </View>
    </ScreenWrap>
  );
};

export const OnboardingCompare = (props) => (
  <OnboardingTemplate
    {...props}
    title="Compare & Save"
    subtitle="See prices from Uber, Bolt and Yango side by side — always pick the cheapest."
    next={ROUTES.ONBOARDING_FAVORITES}
    buttonLabel="Next"
    showSkip
    hero="compare"
  />
);

export const OnboardingFavorites = (props) => (
  <OnboardingTemplate
    {...props}
    title="Save Your Favourite Places"
    subtitle="Set home, work and anywhere else for one-tap comparisons every time."
    next={ROUTES.ONBOARDING_INSIGHTS}
    buttonLabel="Next"
    showSkip
    hero="favorites"
  />
);

export const OnboardingInsights = (props) => (
  <OnboardingTemplate
    {...props}
    title="Make Smarter Decisions"
    subtitle="Surge alerts, demand maps and fare trends help you ride at the best time."
    next={ROUTES.LOGIN}
    buttonLabel="Get Started"
    showSkip={false}
    hero="insights"
  />
);

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: ms(24),
    paddingBottom: ms(40),
    paddingTop: ms(8),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  closeBtn: {
    width: ms(36),
    height: ms(36),
    borderRadius: ms(10),
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  brandLabel: {
    color: "rgba(255,255,255,0.6)",
    fontSize: ms(12),
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  skipText: {
    color: COLORS.fuchsia,
    fontSize: ms(12),
    fontWeight: "600",
    width: ms(36),
    textAlign: "right",
  },
  heroSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  textSection: {
    alignItems: "center",
    gap: ms(10),
    paddingHorizontal: ms(8),
    paddingVertical: ms(20),
  },
  title: {
    fontSize: ms(26),
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: ms(13),
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    lineHeight: ms(20),
    maxWidth: ms(280),
  },
  footer: {
    gap: ms(20),
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: ms(8),
  },
  dot: {
    width: ms(8),
    height: ms(8),
    borderRadius: ms(4),
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    width: ms(28),
    borderRadius: ms(4),
    backgroundColor: COLORS.fuchsia,
  },
});

export default OnboardingTemplate;
