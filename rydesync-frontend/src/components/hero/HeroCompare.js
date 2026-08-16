/**
 * components/hero/HeroCompare.js
 * ───────────────────────────────
 * Onboarding illustration: map card with a price pill ("Compare & Save").
 */
import React from "react";
import { View, Text, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { heroStyles as styles } from "./styles";
import { mapPhoto } from "../../constants/assets";

export const HeroCompare = () => (
  <View style={styles.heroWrap}>
    <View style={styles.heroShadow} />
    <View style={styles.heroRotate}>
      <View style={styles.heroCard}>
        <View style={styles.heroMapInset}>
          <Image source={mapPhoto} style={styles.heroMapImage} resizeMode="cover" />
          <View style={styles.heroMapTint} />
        </View>
        <View style={styles.heroPinOuter} />
        <View style={styles.heroPinInner} />
        <View style={styles.heroPinRing} />
        <View style={styles.heroPricePill}>
          <View style={styles.heroPriceLeft}>
            <View style={styles.heroCarBadge}>
              <MaterialCommunityIcons name="car" size={16} color="#ffb6d7" />
            </View>
            <View style={styles.heroPriceLine} />
          </View>
          <Text style={styles.heroPriceText}>GHS 12.50</Text>
        </View>
      </View>
    </View>
  </View>
);

export default HeroCompare;
