import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DENIED_TOAST_KEY = "obgyn_notif_denied_toast_shown";

/**
 * Pulls active notifications from Lovable Cloud and schedules them locally
 * on the device using @capacitor/local-notifications. No-op on web preview.
 *
 * Resync triggers:
 *  - app boot / focus / coming back online
 *  - realtime row changes on `scheduled_notifications`
 *
 * Android details:
 *  - Creates a high-importance channel ("tips_tricks_default") so banners,
 *    sound and vibration appear on Android 8+.
 *  - Requests POST_NOTIFICATIONS at runtime (required Android 13+).
 */
export function useLocalNotifications() {
  useEffect(() => {
    let cancelled = false;
    let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

    async function ensureChannel(LocalNotifications: typeof import("@capacitor/local-notifications").LocalNotifications) {
      try {
        await LocalNotifications.createChannel({
          id: "tips_tricks_default",
          name: "Daily Tips & Reminders",
          description: "Daily quiz prompts, inspiration and study reminders.",
          importance: 5, // IMPORTANCE_HIGH (heads-up banner)
          visibility: 1, // PUBLIC
          sound: "default",
          vibration: true,
          lights: true,
        });
      } catch {
        /* channel already exists or unsupported platform — safe to ignore */
      }
    }

    async function syncNotifications() {
      try {
        const { Capacitor } = await import("@capacitor/core").catch(() => ({ Capacitor: null as any }));
        if (!Capacitor?.isNativePlatform?.()) return;
        const { LocalNotifications } = await import("@capacitor/local-notifications");

        // 1. Request permission (Android 13+ POST_NOTIFICATIONS / iOS alert)
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== "granted") {
          const req = await LocalNotifications.requestPermissions();
          if (req.display !== "granted") {
            console.info("[notifications] permission denied by user");
            // Show a friendly explanation once per install so the user knows
            // why no reminders ever arrive — and how to fix it.
            if (localStorage.getItem(DENIED_TOAST_KEY) !== "1") {
              localStorage.setItem(DENIED_TOAST_KEY, "1");
              toast.message("التذكيرات معطّلة", {
                description: "فعّل الإشعارات من إعدادات النظام لتصلك تذكيرات يومية.",
                duration: 7000,
              });
            }
            return;
          }
          // User just granted — clear the "denied" flag so future rejections
          // show the toast again, and notify other hooks (e.g. trial-expiry
          // notification scheduler) so they can retry.
          localStorage.removeItem(DENIED_TOAST_KEY);
          window.dispatchEvent(new Event("notif-permission-granted"));
        } else {
          // Already granted previously — still emit once so late mounts retry.
          window.dispatchEvent(new Event("notif-permission-granted"));
        }

        // 2. Make sure the high-importance Android channel exists.
        await ensureChannel(LocalNotifications);

        // 3. Pull active notifications from Cloud.
        const { data, error } = await supabase
          .from("scheduled_notifications")
          .select("*")
          .eq("active", true);
        if (error) {
          console.warn("[notifications] fetch failed:", error.message);
          return;
        }
        if (cancelled) return;

        // 4. Cancel previously scheduled to avoid duplicates.
        const pending = await LocalNotifications.getPending();
        if (pending.notifications.length) {
          await LocalNotifications.cancel({
            notifications: pending.notifications.map((n) => ({ id: n.id })),
          });
        }

        if (!data || data.length === 0) return;

        // 5. Schedule fresh set.
        const now = Date.now();
        const notifs = data
          .map((row, idx) => {
            const at = new Date(row.scheduled_at).getTime();
            const repeat = row.repeat_pattern as "none" | "daily" | "weekly";
            if (repeat === "none" && at < now) return null;

            const schedule: Record<string, unknown> = {
              at: new Date(repeat === "none" ? at : Math.max(at, now)),
              allowWhileIdle: true,
            };
            if (repeat === "daily") schedule.every = "day";
            if (repeat === "weekly") schedule.every = "week";

            return {
              id: idx + 1,
              title: row.title,
              body: row.body,
              schedule,
              channelId: "tips_tricks_default",
              smallIcon: "ic_stat_icon",
              iconColor: "#0ea5e9",
              autoCancel: true,
            };
          })
          .filter(Boolean) as Parameters<typeof LocalNotifications.schedule>[0]["notifications"];

        if (notifs.length) {
          await LocalNotifications.schedule({ notifications: notifs });
          console.info(`[notifications] scheduled ${notifs.length} notification(s)`);
        }
      } catch (e) {
        console.warn("[notifications] sync failed:", e);
      }
    }

    syncNotifications();

    // Resync on focus / online
    const onFocus = () => syncNotifications();
    window.addEventListener("focus", onFocus);
    window.addEventListener("online", onFocus);

    // Realtime — admin edits propagate immediately
    realtimeChannel = supabase
      .channel("notifications-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "scheduled_notifications" },
        () => syncNotifications(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("online", onFocus);
      if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    };
  }, []);
}

/**
 * Fires a one-shot notification ~5 seconds in the future. Used by the in-app
 * "Test notification" button so the user can verify the channel works on
 * their device without waiting for a schedule.
 */
export async function fireTestNotification(): Promise<"ok" | "denied" | "web" | "error"> {
  try {
    const { Capacitor } = await import("@capacitor/core").catch(() => ({ Capacitor: null as any }));
    if (!Capacitor?.isNativePlatform?.()) return "web";
    const { LocalNotifications } = await import("@capacitor/local-notifications");

    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== "granted") {
      const req = await LocalNotifications.requestPermissions();
      if (req.display !== "granted") return "denied";
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 99999,
          title: "Tips & Tricks",
          body: "Notifications are working — see you tomorrow!",
          schedule: { at: new Date(Date.now() + 5_000), allowWhileIdle: true },
          channelId: "tips_tricks_default",
          smallIcon: "ic_stat_icon",
          iconColor: "#0ea5e9",
        },
      ],
    });
    return "ok";
  } catch (e) {
    console.warn("[notifications] test failed:", e);
    return "error";
  }
}
