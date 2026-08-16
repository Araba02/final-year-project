/**
 * components/hero/HeroFavorites.js
 * ─────────────────────────────────
 * Onboarding illustration: saved places (Home / Work / School).
 */
import React from "react";
import { View, Text } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";

import { heroStyles as styles } from "./styles";

export const HeroFavorites = () => (
  <View style={styles.heroWrap}>
    <View style={styles.heroShadow} />
    <View style={styles.heroRotate}>
      <View style={styles.heroCard}>
        <View style={styles.heroFavoritesPin}>
          <Ionicons name="location" size={18} color="#ffb6d7" />
        </View>
        <View style={styles.heroFavRow}>
          <View style={styles.heroFavItem}>
            <View style={styles.heroFavIcon}>
              <Feather name="home" size={16} color="#ffb6d7" />
            </View>
            <Text style={styles.heroFavLabel}>Home</Text>
            <Text style={styles.heroFavMeta}>Set address</Text>
          </View>
          <View style={styles.heroFavItem}>
            <View style={styles.heroFavIcon}>
              <Feather name="briefcase" size={16} color="#ffb6d7" />
            </View>
            <Text style={styles.heroFavLabel}>Work</Text>
            <Text style={styles.heroFavMeta}>Set address</Text>
          </View>
          <View style={styles.heroFavItem}>
            <View style={styles.heroFavIcon}>
              <Feather name="book" size={16} color="#ffb6d7" />
            </View>
            <Text style={styles.heroFavLabel}>School</Text>
            <Text style={styles.heroFavMeta}>Set address</Text>
          </View>
        </View>
      </View>
    </View>
  </View>
);

export default HeroFavorites;
