
# AAB Readiness Audit + Safe Home Enhancement

## Part 1 — Infrastructure Audit (read-only findings)

### A. Notifications ✅ Mostly ready
- `useLocalNotifications` hook syncs from `scheduled_notifications` table to Capacitor `LocalNotifications` plugin on every focus/online event.
- Permission flow (`checkPermissions` → `requestPermissions`) implemented correctly.
- Cancels previous schedules to avoid duplicates, supports `none/daily/weekly` repeats.
- Icon (`ic_stat_icon`) declared in `capacitor.config.ts`.
- ⚠ Issue: `useLocalNotifications` is mounted **only inside `NotificationsBootstrap`** which lives **inside the non-SAFE branch** of `App.tsx`. In `SAFE_MODE = true` the hook never runs → no notifications scheduled on the released AAB.
- ⚠ The `scheduled_notifications` table needs at least one active row for testing.

### B. Payments / Google Play Billing ✅ Solid pipeline
- `initStore()` registers products at boot, listens for `approved`, server-verifies via `verify-purchase` edge function, then calls `p.finish()`.
- `check-access` edge function reconciles entitlement every 5 min + on focus (via `useAccess`).
- RTDN webhook `play-rtdn-webhook` handles renewals/cancellations.
- Admin **Billing Monitor** exposes purchase events.
- ⚠ Same SAFE_MODE issue: Paywall, AccessGate, billing init are all behind the non-safe branch. In SAFE_MODE the AAB ships **with no IAP UI exposed**, which is fine for first launch but means the in-app product IDs won't show in Play Console "active in app" until SAFE_MODE is turned off.
- ⚠ `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` secret is set — verify it has Play Developer API access enabled.

### C. App version metadata ⚠ Needs bump before upload
- `capacitor.config.ts` exports `APP_VERSION_NAME = "1.0.0"` and `APP_VERSION_CODE = 1`.
- Confirm the Gradle hook in `android/app/build.gradle` actually reads these (mentioned in README, must be present in the local Android project).
- For every Play upload, `versionCode` MUST increment.
- `appId: app.lovable.tipstricks` ✅ stable.
- App display name `Tips & Tricks – OB/GYN` — Google may flag the "OB/GYN" suffix as medical positioning during the SAFE_MODE submission. Recommend a neutral display name for v1.0.0 (e.g. **"Tips & Tricks Daily Quiz"**), then change it after the medical version is approved separately.
- `index.html` `<title>`, meta description, OG tags still mention "OB/GYN" → align with the safe submission.

### D. Home page (SAFE_MODE) ✅ Non-clinical
- `App.tsx` short-circuits to `SafeHome` when `SAFE_MODE = true`.
- `SafeHome` only renders 100 generic-knowledge MCQs from `safeQuestions.ts`, plus legal pages.
- No clinical routes, no disclaimer, no bottom tab bar are mounted.
- All clinical components (HomeHero, EmergencyStrip, etc.) are tree-shaken from the SAFE bundle because SafeHome doesn't import them.
- ✅ Safe to submit as-is for AAB review.

---

## Part 2 — Safe Home Enhancement (non-clinical, women & motherhood lifestyle)

Add lightweight, **entertainment-only** sections to `SafeHome` in English. Strictly NO medical terms, NO advice, NO drug names, NO procedures. Tone is lifestyle / inspiration / general culture.

### New sections (proposed)
1. **Daily Affirmations for Women** — rotating positive quote of the day from a static list of ~30 generic empowerment quotes.
2. **Motherhood Wisdom** — short historical/cultural sayings about mothers from world cultures.
3. **Self-Care Habits** — non-medical lifestyle tips (hydration reminder, journaling prompt, gratitude prompt).
4. **Famous Women in History** — mini-card series (e.g. Marie Curie, Ada Lovelace) — pure history.
5. **Word of the Day** — vocabulary builder unrelated to health.
6. **Today's Reflection** — one open-ended journaling prompt.

All content lives in plain TS data files (no DB), no external API calls, fully offline.

### UI changes
- Convert `SafeHome` from a single quiz page into a **3-tab layout**:
  - **Quiz** (existing 100 questions — unchanged)
  - **Inspiration** (affirmations + motherhood wisdom + reflection)
  - **Discover** (famous women + word of the day + self-care habits)
- Tabs implemented with the existing shadcn `Tabs` component to keep bundle small.
- Keep the legal acceptance gate and footer untouched.

### Technical changes section

```text
src/pages/SafeHome.tsx           ← refactor: wrap content in <Tabs>
src/data/safeContent.ts          ← NEW: arrays of affirmations, wisdom, women, words, prompts
src/components/safe/
   ├── InspirationTab.tsx        ← NEW
   └── DiscoverTab.tsx           ← NEW
src/App.tsx                      ← move useLocalNotifications() into SAFE branch too
capacitor.config.ts              ← bump APP_VERSION_CODE → 2, optionally rename appName to "Tips & Tricks Daily Quiz"
index.html                       ← align title/description/OG to neutral wording
```

No edge function changes, no DB migrations, no new dependencies.

---

## Part 3 — Final pre-upload checklist (manual, outside the code)

1. Run `CAP_ENV=production npm run build && npx cap sync android`.
2. Bump `versionCode` for every re-upload.
3. In Play Console: data-safety form, content rating questionnaire, privacy URL → already at `/public/privacy.html`.
4. Upload signed AAB from `android/app/build/outputs/bundle/release/app-release.aab`.
5. After approval: flip `SAFE_MODE = false`, bump version, ship the medical version under the same package only if Google explicitly allows it; otherwise keep two separate apps.

---

Approve to proceed with the code changes in Part 2 + the metadata bumps in Part 1-C.
