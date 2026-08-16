import React from "react";
import { Pressable, Text, StyleSheet } from "react-native";

import { ms } from "../../utils/responsive";

export const SecondaryButton = ({ label, onPress, style }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.btn, pressed && { opacity: 0.75 }, style]}
  >
    <Text style={styles.text}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  btn: {
    height: ms(48),
    borderRadius: ms(14),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: "rgba(255,255,255,0.75)",
    fontSize: ms(13),
    fontWeight: "600",
    letterSpacing: 0.1,
  },
});

export default SecondaryButton;
