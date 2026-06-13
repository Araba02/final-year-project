/**
 * screens/ExploreScreen.js
 * ─────────────────────────
 * Full-bleed map explorer with search, quick chips, area info card and
 * demand banner.
 */
import React from "react";
import { View, Text, Pressable, Image, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenWrap, BottomNav } from "../components/layout";
import { PrimaryButton } from "../components/Button";
import { COLORS } from "../theme/colors";
import { ms } from "../utils/responsive";
import { mapPhoto } from "../constants/assets";
import { ROUTES } from "../navigation/routes";

export const ExploreScreen = ({ navigation }) => (
  <ScreenWrap
    title={null}
    scroll={false}
    contentStyle={{ paddingHorizontal: 0, paddingTop: 0 }}
    footer={<BottomNav navigation={navigation} active="map" />}
  >
    <View style={styles.exploreWrap}>
      <Image source={mapPhoto} style={styles.exploreMap} resizeMode="cover" />
      <View style={styles.exploreOverlay} />
      <View style={styles.exploreContent}>
        <View style={styles.explorePill}>
          <Text style={styles.explorePillText}>Explore Ride Conditions</Text>
        </View>
        <View style={styles.exploreSearch}>
          <Feather name="search" size={ms(12)} color={COLORS.fuchsia} />
          <Text style={styles.exploreSearchText}>Search destination or tap map</Text>
        </View>
        <View style={styles.exploreChips}>
          {["Home", "Work", "Airport"].map((chip) => (
            <View key={chip} style={styles.exploreChip}>
              <Text style={styles.exploreChipText}>{chip}</Text>
            </View>
          ))}
        </View>
        <View style={styles.exploreInfo}>
          <Text style={styles.exploreTitle}>Osu, Accra</Text>
          <Text style={styles.exploreMeta}>Oxford Street District</Text>
          <View style={styles.exploreRow}>
            <Text style={styles.exploreLabel}>Avg price</Text>
            <Text style={styles.exploreLabel}>ETA</Text>
          </View>
          <View style={styles.exploreRow}>
            <Text style={styles.exploreValue}>GHS 30</Text>
            <Text style={styles.exploreValue}>5-7 min</Text>
          </View>
          <PrimaryButton label="Compare Rides" style={{ marginTop: ms(10) }} onPress={() => navigation.navigate(ROUTES.COMPARE_RIDES)} />
        </View>
        <View style={styles.exploreZoom}>
          <Pressable style={styles.exploreZoomBtn}>
            <Text style={styles.exploreZoomText}>+</Text>
          </Pressable>
          <Pressable style={styles.exploreZoomBtn}>
            <Text style={styles.exploreZoomText}>-</Text>
          </Pressable>
        </View>
        <View style={styles.exploreBanner}>
          <Text style={styles.exploreBannerText}>Best area nearby: East Legon (Cheapest rides now)</Text>
        </View>
      </View>
    </View>
  </ScreenWrap>
);

const styles = StyleSheet.create({
  exploreWrap: {
    flex: 1,
    backgroundColor: "#000",
  },
  exploreMap: {
    width: "100%",
    height: "100%",
  },
  exploreOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  exploreContent: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: ms(20),
    paddingTop: ms(40),
  },
  explorePill: {
    alignSelf: "center",
    paddingHorizontal: ms(16),
    paddingVertical: ms(8),
    borderRadius: ms(999),
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  explorePillText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: ms(12),
    fontWeight: "600",
  },
  exploreSearch: {
    marginTop: ms(12),
    flexDirection: "row",
    alignItems: "center",
    gap: ms(8),
    paddingHorizontal: ms(16),
    paddingVertical: ms(8),
    borderRadius: ms(999),
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  exploreSearchText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: ms(10),
  },
  exploreChips: {
    marginTop: ms(10),
    flexDirection: "row",
    gap: ms(8),
    justifyContent: "center",
  },
  exploreChip: {
    paddingHorizontal: ms(12),
    paddingVertical: ms(6),
    borderRadius: ms(999),
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  exploreChipText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: ms(10),
  },
  exploreInfo: {
    marginTop: ms(20),
    alignSelf: "center",
    width: "80%",
    borderRadius: ms(24),
    padding: ms(16),
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  exploreTitle: {
    color: "#fff",
    fontWeight: "600",
    fontSize: ms(12),
    textAlign: "center",
  },
  exploreMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(10),
    textAlign: "center",
    marginTop: ms(2),
  },
  exploreRow: {
    marginTop: ms(8),
    flexDirection: "row",
    justifyContent: "space-between",
  },
  exploreLabel: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(10),
  },
  exploreValue: {
    color: "#fff",
    fontSize: ms(12),
    fontWeight: "600",
  },
  exploreZoom: {
    position: "absolute",
    right: ms(16),
    top: "45%",
    gap: ms(8),
  },
  exploreZoomBtn: {
    width: ms(32),
    height: ms(32),
    borderRadius: ms(16),
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  exploreZoomText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: ms(14),
  },
  exploreBanner: {
    position: "absolute",
    left: ms(20),
    right: ms(20),
    bottom: ms(120),
    paddingHorizontal: ms(12),
    paddingVertical: ms(8),
    borderRadius: ms(999),
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  exploreBannerText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: ms(10),
    textAlign: "center",
  },
});

export default ExploreScreen;
