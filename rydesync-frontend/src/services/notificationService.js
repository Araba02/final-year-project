/**
 * services/notificationService.js
 * ─────────────────────────────────
 * Push notification setup for Expo managed workflow.
 *
 * Requests permission, obtains the Expo push token, registers it with the
 * backend, and configures the foreground notification handler. All operations
 * are best-effort — failures are swallowed so auth flow is never blocked.
 *
 * Token format: "ExponentPushToken[...]" — the backend's notifications.py
 * detects this prefix and routes to the Expo Push API automatically.
 */
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { authService } from "./authService";

// Show alerts, play sound and set badge while the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  /**
   * Request permission, get the Expo push token, and save it to the backend.
   * Call this once after the user is authenticated.
   * Returns the token string on success, or null if denied / unavailable.
   */
  async register() {
    try {
      // Android requires a notification channel before tokens can be used.
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("surge_alerts", {
          name: "Surge Alerts",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#FF4F9A",
          sound: "default",
        });
      }

      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") return null;

      const { data: token } = await Notifications.getExpoPushTokenAsync();
      // Best-effort: don't let a network failure block the caller.
      authService.registerFcmToken(token).catch(() => {});
      return token;
    } catch {
      return null;
    }
  },

  /**
   * Subscribe to notifications received while the app is in the foreground.
   * Returns an EventSubscription — call `.remove()` to unsubscribe.
   */
  onNotificationReceived(handler) {
    return Notifications.addNotificationReceivedListener(handler);
  },

  /**
   * Subscribe to the user tapping a notification (any app state).
   * Returns an EventSubscription — call `.remove()` to unsubscribe.
   */
  onNotificationResponse(handler) {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },
};

export default notificationService;
