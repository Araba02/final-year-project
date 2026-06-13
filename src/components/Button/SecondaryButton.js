/**
 * components/Button/SecondaryButton.js
 * ─────────────────────────────────────
 * Secondary button (outlined glass pill).
 */
import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";

import { COLORS } from "../../theme/colors";
import { ms } from "../../utils/responsive";

export const SecondaryButton = ({ label, onPress, style }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed, style]}
  >
    <Text style={styles.secondaryButtonText}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  secondaryButton: {
    height: ms(40),
    borderRadius: ms(999),
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.card,
  },
  secondaryButtonPressed: {
    opacity: 0.8,
  },
  secondaryButtonText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: ms(12),
    fontWeight: "600",
  },
});

export default SecondaryButton;
