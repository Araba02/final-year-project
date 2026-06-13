/**
 * components/feedback/StateViews.js
 * ──────────────────────────────────
 * Small, reusable async-state views: Loading / Error / Empty. They keep the
 * dark fuchsia look and are used by every data-bound screen so the
 * loading→error→empty lifecycle is consistent app-wide.
 */
import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { PrimaryButton } from "../Button";
import { COLORS } from "../../theme/colors";
import { ms } from "../../utils/responsive";

export const LoadingState = ({ label = "Loading...", style }) => (
  <View style={[styles.center, style]}>
    <ActivityIndicator color={COLORS.fuchsia} />
    {label ? <Text style={styles.muted}>{label}</Text> : null}
  </View>
);

export const ErrorState = ({ message = "Something went wrong.", onRetry, style }) => (
  <View style={[styles.center, style]}>
    <Feather name="alert-triangle" size={ms(28)} color={COLORS.fuchsia} />
    <Text style={styles.message}>{message}</Text>
    {onRetry ? <PrimaryButton label="Try Again" onPress={onRetry} style={styles.retry} /> : null}
  </View>
);

export const EmptyState = ({ icon = "inbox", title = "Nothing here yet", message, style }) => (
  <View style={[styles.center, style]}>
    <View style={styles.emptyBadge}>
      <Feather name={icon} size={ms(22)} color="#ffb6d7" />
    </View>
    <Text style={styles.emptyTitle}>{title}</Text>
    {message ? <Text style={styles.muted}>{message}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: ms(10),
    paddingVertical: ms(40),
    paddingHorizontal: ms(20),
  },
  muted: {
    color: "rgba(255,255,255,0.5)",
    fontSize: ms(12),
    textAlign: "center",
  },
  message: {
    color: "rgba(255,255,255,0.7)",
    fontSize: ms(12),
    textAlign: "center",
    maxWidth: ms(260),
  },
  retry: {
    marginTop: ms(8),
    paddingHorizontal: ms(24),
    minWidth: ms(140),
  },
  emptyBadge: {
    width: ms(56),
    height: ms(56),
    borderRadius: ms(28),
    backgroundColor: COLORS.fuchsiaSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#fff",
    fontSize: ms(14),
    fontWeight: "600",
  },
});

export default { LoadingState, ErrorState, EmptyState };
