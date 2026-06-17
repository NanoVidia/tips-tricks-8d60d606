import { useEffect } from "react";
import { getAccessState } from "@/lib/billing/trial";

const SCHEDULED_KEY = "obgyn_trial_notif_scheduled_for";
const POST_GRANT_RESCHEDULED_KEY = "obgyn_trial_notif_post_grant_done";
const NOTIF_ID = 9_999_001; // unique id outside scheduled_notifications range

/**
 * Schedules a single local notification 24h before the trial ends.
 * No-op on web. Cancels itself when the user subscribes.
 *
 * Re-runs whenever the entitlement changes or the user finally grants the
 * notification permission (event emitted by `useLocalNotifications`), so a
 * late grant still results in a scheduled reminder.
 */
export function useTrialExpiryNotification() {
  useEffect(() => {
    let cancelled = false;

    async function trySchedule() {
      try {
        const { Capacitor } = await import("@capacitor/core").catch(() => ({ Capacitor: null as any }));
        if (!Capacitor?.isNativePlatform?.()) return;
        const { LocalNotifications } = await import("@capacitor/local-notifications");

        const state = getAccessState();

        // If user is paid → cancel any pending trial-end notification.
        if (state.status === "paid") {
          await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] }).catch(() => {});
          localStorage.removeItem(SCHEDULED_KEY);
          return;
        }

        if (state.status !== "trial" || !state.trialEndsAt) return;
        const endsMs = new Date(state.trialEndsAt).getTime();
        const fireAt = endsMs - 24 * 60 * 60 * 1000;
        // Don't schedule in the past or less than 1 hour from now.
        if (fireAt - Date.now() < 60 * 60 * 1000) return;

        const already = localStorage.getItem(SCHEDULED_KEY);
        if (already && parseInt(already, 10) === fireAt) return; // already scheduled

        // Permission check (granted by useLocalNotifications on first boot).
        const perm = await LocalNotifications.checkPermissions();
        if (perm.display !== "granted") return;

        await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] }).catch(() => {});
        if (cancelled) return;

        await LocalNotifications.schedule({
          notifications: [
            {
              id: NOTIF_ID,
              title: "Your trial ends in 24 hours",
              body: "Subscribe now to keep full access to all tools and exams.",
              schedule: { at: new Date(fireAt), allowWhileIdle: true },
              channelId: "tips_tricks_default",
              smallIcon: "ic_stat_icon",
              extra: { route: "/?paywall=1" },
            },
          ],
        });
        localStorage.setItem(SCHEDULED_KEY, String(fireAt));
      } catch (err) {
        console.warn("[trial-notif] failed", err);
      }
    }

    trySchedule();

    // Retry once — and only once per install — when the user finally grants
    // notification permission. Prevents duplicate scheduling if the
    // `notif-permission-granted` event fires multiple times (focus resyncs,
    // realtime resubscribes, etc.).
    const onPermissionGranted = () => {
      if (localStorage.getItem(POST_GRANT_RESCHEDULED_KEY) === "1") return;
      localStorage.setItem(POST_GRANT_RESCHEDULED_KEY, "1");
      trySchedule();
    };
    // Entitlement changes (purchase / restore / trial reset) should always
    // re-evaluate — `trySchedule` itself guards against duplicate fire-times.
    const onEntitlementChanged = () => trySchedule();

    window.addEventListener("notif-permission-granted", onPermissionGranted);
    window.addEventListener("entitlement-changed", onEntitlementChanged);

    return () => {
      cancelled = true;
      window.removeEventListener("notif-permission-granted", onPermissionGranted);
      window.removeEventListener("entitlement-changed", onEntitlementChanged);
    };
  }, []);
}
