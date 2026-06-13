/**
 * components/Button/PrimaryButton.js
 * ───────────────────────────────────
 * Primary call-to-action button (filled fuchsia pill).
 */
import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";

import { COLORS } from "../../theme/colors";
import { ms } from "../../utils/responsive";

export const PrimaryButton = ({ label, onPress, style }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed, style]}
  >
    <Text style={styles.primaryButtonText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  primaryButton: {
    height: ms(44),
    borderRadius: ms(999),
    backgroundColor: COLORS.fuchsia,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.fuchsia,
    shadowOpacity: 0.35,
    shadowRadius: ms(12),
    shadowOffset: { width: 0, height: ms(6) },
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: ms(14),
    letterSpacing: 0.2,
  },
});

export default PrimaryButton;
