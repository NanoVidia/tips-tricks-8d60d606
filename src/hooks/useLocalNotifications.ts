import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Pulls active notifications from Lovable Cloud and schedules them locally
 * on the device using @capacitor/local-notifications. No-op on web preview.
 *
 * Re-runs whenever the app gains focus / comes back online so changes from
 * the admin panel propagate within seconds.
 */
export function useLocalNotifications() {
  useEffect(() => {
    let cancelled = false;

    async function syncNotifications() {
      try {
        // Lazy import — Capacitor plugins only resolve on a real device build
        const { Capacitor } = await import("@capacitor/core").catch(() => ({ Capacitor: null as any }));
        if (!Capacitor?.isNativePlatform?.()) return;
        const { LocalNotifications } = await import("@capacitor/local-notifications");

        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== "granted") {
          const req = await LocalNotifications.requestPermissions();
          if (req.display !== "granted") return;
        }

        const { data, error } = await supabase
          .from("scheduled_notifications")
          .select("*")
          .eq("active", true);
        if (error || !data || cancelled) return;

        // Cancel previously scheduled to avoid duplicates
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length) {
          await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
        }

        const now = Date.now();
        const notifs = data
          .map((row, idx) => {
            const at = new Date(row.scheduled_at).getTime();
            const repeat = row.repeat_pattern as "none" | "daily" | "weekly";
            // Skip past one-shot notifications
            if (repeat === "none" && at < now) return null;

            const schedule: any = { at: new Date(repeat === "none" ? at : Math.max(at, now)) };
            if (repeat === "daily") schedule.every = "day";
            if (repeat === "weekly") schedule.every = "week";

            return {
              id: idx + 1, // local int id
              title: row.title,
              body: row.body,
              schedule,
              smallIcon: "ic_stat_icon",
            };
          })
          .filter(Boolean) as any[];

        if (notifs.length) {
          await LocalNotifications.schedule({ notifications: notifs });
        }
      } catch (e) {
        console.warn("Local notification sync failed:", e);
      }
    }

    syncNotifications();
    const onFocus = () => syncNotifications();
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
    };
  }, []);
}
