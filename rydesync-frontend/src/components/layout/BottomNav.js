import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

export const BottomNav = ({ navigation, active }) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomNav, { paddingBottom: insets.bottom + ms(10) }]}>
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        if (item.center) {
          return (
            <Pressable
              key={item.id}
              onPress={() => navigation.navigate(item.target)}
              style={styles.bottomNavCenter}
              hitSlop={6}
            >
              <View style={styles.bottomNavCenterInner}>
                <Feather name={item.icon} size={ms(20)} color={COLORS.text} />
              </View>
            </Pressable>
          );
        }
        return (
          <Pressable
            key={item.id}
            onPress={() => navigation.navigate(item.target)}
            style={styles.bottomNavItem}
            hitSlop={6}
          >
            <Feather
              name={item.icon}
              size={ms(20)}
              color={isActive ? COLORS.fuchsia : "rgba(255,255,255,0.4)"}
            />
            <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: ms(20),
    paddingTop: ms(12),
    backgroundColor: "#1a0910",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    zIndex: 10, // ensures floating center button captures taps above the scroll area
    overflow: "visible",
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    gap: ms(5),
    paddingVertical: ms(2),
  },
  bottomNavLabel: {
    fontSize: ms(9),
    letterSpacing: ms(1),
    color: "rgba(255,255,255,0.4)",
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
    marginTop: ms(-28),
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.5,
    shadowRadius: ms(16),
    shadowOffset: { width: 0, height: ms(6) },
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
