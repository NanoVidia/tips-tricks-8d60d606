import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Handles taps on local notifications. When a notification carries
 * `extra.route`, we navigate the SPA there instead of opening to the
 * last-viewed screen. No-op on web.
 */
export function useNotificationTapHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    let handle: { remove: () => Promise<void> } | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core").catch(() => ({ Capacitor: null as any }));
        if (!Capacitor?.isNativePlatform?.()) return;
        const { LocalNotifications } = await import("@capacitor/local-notifications");

        const listener = await LocalNotifications.addListener(
          "localNotificationActionPerformed",
          (event) => {
            const extra = event.notification?.extra as { route?: string } | undefined;
            const route = extra?.route;
            if (route && typeof route === "string" && route.startsWith("/")) {
              navigate(route);
            }
          },
        );
        if (cancelled) {
          await listener.remove();
        } else {
          handle = listener;
        }
      } catch (err) {
        console.warn("[notifications] tap handler init failed", err);
      }
    })();

    return () => {
      cancelled = true;
      handle?.remove().catch(() => {});
    };
  }, [navigate]);
}
