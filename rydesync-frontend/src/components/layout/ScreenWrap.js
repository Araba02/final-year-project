import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { COLORS } from "../../theme/colors";
import { ms, MAX_CONTENT_WIDTH } from "../../utils/responsive";

/**
 * Screen shell — safe-area aware, optional sticky header, scrollable body,
 * optional pinned footer.
 *
 * Root cause of prior scroll breakage: wrapping the ScrollView in a
 * KeyboardAvoidingView with flex:1 + behavior="padding" forces iOS to
 * miscalculate the scroll height, making every screen appear non-scrollable.
 * Fix: remove KAV entirely and use automaticallyAdjustKeyboardInsets (native
 * iOS keyboard handling built into ScrollView since RN 0.67).
 *
 * Safe-area strategy:
 *   • SafeAreaView handles top/left/right only.
 *   • BottomNav handles its own bottom inset via useSafeAreaInsets.
 *   • Footerless screens get paddingBottom += bottom inset so content is
 *     never hidden behind the home indicator.
 */
export const ScreenWrap = ({
  title,
  header,
  children,
  footer,
  contentStyle,
  scroll = true,
}) => {
  const insets = useSafeAreaInsets();
  const extraBottom = footer ? 0 : insets.bottom;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        {title ? (
          <View style={styles.titleBar}>
            <Text style={styles.screenTitle}>{title}</Text>
          </View>
        ) : null}

        {header ? <View style={styles.stickyHeader}>{header}</View> : null}

        {scroll ? (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              extraBottom > 0 && { paddingBottom: ms(32) + extraBottom },
              contentStyle,
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.nonScrollContent, contentStyle]}>{children}</View>
        )}

        {footer}
      </View>
    </SafeAreaView>
  );
};

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
    overflow: "visible", // lets the floating center nav button render above the nav bar
  },
  titleBar: {
    paddingHorizontal: ms(20),
    paddingTop: ms(6),
    paddingBottom: ms(8),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  screenTitle: {
    color: COLORS.text,
    fontSize: ms(13),
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  stickyHeader: {
    paddingHorizontal: ms(20),
    paddingTop: ms(12),
    paddingBottom: ms(8),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: ms(20),
    paddingTop: ms(14),
    paddingBottom: ms(32),
  },
  nonScrollContent: {
    flex: 1,
  },
});

export default ScreenWrap;
