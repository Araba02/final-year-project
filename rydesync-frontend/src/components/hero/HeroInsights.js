/**
 * components/hero/HeroInsights.js
 * ────────────────────────────────
 * Onboarding illustration: price trend + smart recommendation card.
 */
import React from "react";
import { View, Text } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import { heroStyles as styles } from "./styles";

export const HeroInsights = () => (
  <View style={styles.heroWrap}>
    <View style={styles.heroShadow} />
    <View style={styles.heroRotate}>
      <View style={[styles.heroCard, styles.heroInsightsCard]}>
        <View style={styles.heroInsightsHeader}>
          <View>
            <Text style={styles.heroInsightsLabel}>PRICE TREND</Text>
            <Text style={styles.heroInsightsValue}>-12%</Text>
            <Text style={styles.heroInsightsMeta}>dropping</Text>
          </View>
          <View style={styles.heroInsightsIcon}>
            <Feather name="trending-down" size={16} color="#ffb6d7" />
          </View>
        </View>
        <View style={styles.heroSmartCard}>
          <View style={styles.heroStars}>
            <Ionicons name="sparkles" size={14} color="#fff" />
            <Ionicons name="sparkles" size={9} color="#fff" style={{ marginLeft: -4, marginTop: 6 }} />
            <Ionicons name="sparkles" size={9} color="#fff" style={{ marginLeft: -2, marginTop: -10 }} />
          </View>
          <View style={styles.heroSmartText}>
            <View style={styles.heroSmartRow}>
              <Text style={styles.heroSmartTitle}>Smart Recommendation</Text>
              <Text style={styles.heroSmartArrow}>&gt;</Text>
            </View>
            <Text style={styles.heroSmartMeta}>UberX is cheaper than Bolt at 3:00pm</Text>
          </View>
        </View>
        <View style={styles.heroInsightsPin}>
          <Ionicons name="location" size={14} color="#ffb6d7" />
        </View>
      </View>
    </View>
  </View>
);

export default HeroInsights;
