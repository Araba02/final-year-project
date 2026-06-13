/**
 * components/layout/ScreenWrap.js
 * ────────────────────────────────
 * Standard screen shell: safe-area aware, optional centered title, optional
 * scrolling body, and an optional pinned footer (e.g. the bottom nav).
 *
 * Responsiveness:
 *   - Uses react-native-safe-area-context so notches / home indicators are
 *     respected on every device.
 *   - Constrains the body to a max-width column and centers it on large
 *     screens (tablet / web). On phones (narrower than the column) this is a
 *     no-op, so the original phone layout is unchanged.
 */
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { COLORS } from "../../theme/colors";
import { ms, MAX_CONTENT_WIDTH } from "../../utils/responsive";

export const ScreenWrap = ({ title, children, footer, contentStyle, scroll = true }) => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar style="light" />
    <View style={styles.screen}>
      {title ? <Text style={styles.screenTitle}>{title}</Text> : null}
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scrollContent, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  screen: {
    flex: 1,
    width: "100%",
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: "center",
    backgroundColor: COLORS.bg,
    paddingHorizontal: ms(20),
    paddingTop: ms(10),
  },
  screenTitle: {
    color: COLORS.text,
    fontSize: ms(12),
    fontWeight: "600",
    textAlign: "center",
    marginBottom: ms(6),
  },
  scrollContent: {
    paddingBottom: ms(120),
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default ScreenWrap;
