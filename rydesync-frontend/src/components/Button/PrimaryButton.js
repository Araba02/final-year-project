import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { COLORS } from "../../theme/colors";
import { ms } from "../../utils/responsive";

export const PrimaryButton = ({ label, onPress, style }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.btn, pressed && { opacity: 0.86 }, style]}
  >
    <LinearGradient
      colors={["#ff79c0", COLORS.fuchsia, "#c2005a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={StyleSheet.absoluteFill}
    />
    <Text style={styles.text}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  btn: {
    height: ms(48),
    borderRadius: ms(14),
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.fuchsia,
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.42,
    shadowRadius: ms(14),
    shadowOffset: { width: 0, height: ms(6) },
  },
  text: {
    color: "#fff",
    fontWeight: "700",
    fontSize: ms(14),
    letterSpacing: 0.2,
  },
});

export default PrimaryButton;
