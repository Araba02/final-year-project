/**
 * components/layout/BottomNav.js
 * ───────────────────────────────
 * Bottom tab bar with a raised center action. Purely navigational; the
 * `active` prop highlights the current tab.
 */
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { COLORS } from "../../theme/colors";
import { ms } from "../../utils/responsive";
import { ROUTES } from "../../navigation/routes";

const NAV_ITEMS = [
  { id: "home", label: "HOME", icon: "home", target: ROUTES.HOME },
  { id: "history", label: "HISTORY", icon: "clock", target: ROUTES.HISTORY },
  { id: "map", label: "MAP", icon: "map-pin", target: ROUTES.EXPLORE, center: true },
  { id: "insights", label: "INSIGHTS", icon: "bar-chart-2", target: ROUTES.INSIGHTS },
  { id: "profile", label: "PROFILE", icon: "user", target: ROUTES.PROFILE },
];

export const BottomNav = ({ navigation, active }) => (
  <View style={styles.bottomNav}>
    {NAV_ITEMS.map((item) => {
      const isActive = active === item.id;
      if (item.center) {
        return (
          <Pressable key={item.id} onPress={() => navigation.navigate(item.target)} style={styles.bottomNavCenter}>
            <View style={styles.bottomNavCenterInner}>
              <Feather name={item.icon} size={ms(20)} color={COLORS.text} />
            </View>
          </Pressable>
        );
      }
      return (
        <Pressable key={item.id} onPress={() => navigation.navigate(item.target)} style={styles.bottomNavItem}>
          <Feather name={item.icon} size={ms(20)} color={isActive ? COLORS.fuchsia : "rgba(255,255,255,0.5)"} />
          <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>{item.label}</Text>
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: ms(20),
    paddingBottom: ms(18),
    paddingTop: ms(14),
    backgroundColor: "#220b15",
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    gap: ms(6),
  },
  bottomNavLabel: {
    fontSize: ms(9),
    letterSpacing: ms(2),
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
  },
  bottomNavLabelActive: {
    color: COLORS.fuchsia,
  },
  bottomNavCenter: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center",
    marginTop: ms(-30),
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.45,
    shadowRadius: ms(18),
    shadowOffset: { width: 0, height: ms(8) },
  },
  bottomNavCenterInner: {
    width: ms(44),
    height: ms(44),
    borderRadius: ms(22),
    backgroundColor: "#2a0f1c",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default BottomNav;
