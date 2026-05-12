# Google Play Store Listing — Tips & Tricks Daily Quiz

Copy-paste these fields directly into the Google Play Console.

---

## App identity

| Field | Value |
|---|---|
| App name | `Tips & Tricks Daily Quiz` |
| Default language | English (United States) – `en-US` |
| App category | Education |
| Tags | Trivia, Learning, Daily, Inspiration |
| Contact email | `support@tips-tricks.lovable.app` |
| Website | `https://tips-tricks.lovable.app` |
| Privacy policy URL | `https://tips-tricks.lovable.app/privacy.html` |

---

## Short description (max 80 chars)

```
Daily quiz, fresh trivia, inspiring quotes & lifestyle tips — learn 5 min/day.
```

## Full description (max 4000 chars)

```
Tips & Tricks is the calm, beautiful daily-knowledge app that helps you learn
something new in 5 minutes a day — without the noise.

Every day brings a fresh mix of:

🧠  DAILY QUIZ
A hand-curated set of 100+ general-knowledge questions across science, history,
language, geography and culture. Tap an answer, get an instant explanation, and
track your streak.

✨  INSPIRATION
A daily dose of timeless quotes and short reflections to start your day with
clarity and intention.

🎓  EXAMS
Quick self-assessment sets for exam prep, vocabulary and reasoning practice.

🌍  DISCOVER
Bite-sized facts and lifestyle tips you can use the same day — from focus
techniques to sleep hygiene to language hacks.

WHY YOU'LL LIKE IT
• Beautifully simple, distraction-free design
• Works fully offline once installed
• No ads, no trackers, no spam
• Optional gentle reminders so you never miss a day
• Restore Purchases supported (Google Play Billing)

WHO IT'S FOR
Anyone who loves learning — students, teachers, lifelong learners, curious
minds, and anyone who wants a calmer alternative to social-media scrolling.

PRIVACY-FIRST
Your quiz progress stays on your device. We don't sell your data. We don't run
ads. The app collects only what's needed for sign-in and purchases.

DISCLAIMER
This app provides general educational and lifestyle content only. It is NOT
medical, legal or financial advice. Always consult a qualified professional
for personal decisions.

Have feedback? We read every email — write to us anytime.
```

---

## Graphic assets (already prepared in /mnt/documents/play-store/)

| Asset | File | Size |
|---|---|---|
| App icon | `play-icon-512x512.png` | 512×512 PNG |
| Feature graphic | `play-feature-graphic-1024x500.png` | 1024×500 PNG |
| Phone screenshot 1 | `screenshot-1-1080x1920.png` | 1080×1920 PNG |
| Phone screenshot 2 | `screenshot-2-1080x1920.png` | 1080×1920 PNG |

Upload at: **Play Console → Main store listing → Graphics**

---

## Data Safety form answers

### Data collected
| Data type | Collected | Shared | Purpose | Optional? |
|---|---|---|---|---|
| Email address | ✅ | ❌ | Account management | Required |
| Purchase history | ✅ | ❌ | Account management, in-app purchases | Required |
| App interactions (quiz progress) | ❌ (stored on-device only) | — | — | — |
| Crash logs | ❌ | — | — | — |
| Device or other IDs | ❌ | — | — | — |

### Data security practices
- ✅ Data is encrypted in transit (HTTPS)
- ✅ Users can request data deletion (via support email)
- ❌ We do not collect data for third-party advertising

---

## Content rating questionnaire — recommended answers

| Question | Answer |
|---|---|
| Does the app contain violence? | No |
| Does the app contain sexual content? | No |
| Does the app contain profanity? | No |
| Does the app contain controlled substances? | No |
| Does the app share user-generated content? | No |
| Does the app share user location? | No |
| Does the app collect personal info? | Yes — email for sign-in only |

→ Expected rating: **Everyone / PEGI 3 / IARC: All ages**

---

## In-app products (subscriptions)

Set up under **Monetize → Products → Subscriptions** with these IDs
(must match `src/lib/billing/plans.ts`):

| Product ID | Name | Billing period | Suggested price |
|---|---|---|---|
| `tt_monthly` | Tips & Tricks Pro – Monthly | 1 month | $2.99 |
| `tt_yearly` | Tips & Tricks Pro – Yearly | 1 year | $19.99 |
| `tt_lifetime` | Tips & Tricks Pro – Lifetime | one-time | $49.99 |

Add a **7-day free trial** offer on the monthly and yearly plans.

---

## Release tracks — recommended order

1. **Internal testing** → add yourself as a tester. Verify Restore Purchases,
   notifications, and quiz flow on a real device.
2. **Closed testing (Alpha)** → invite 5–20 friends for 1 week. Required by
   Google for new personal accounts before production.
3. **Production** → submit for review. First review usually takes 3–7 days.

---

## Final pre-submission checklist

- [ ] AAB built with `versionCode 3` / `versionName "1.1.0"`
- [ ] AAB signed with your release keystore (KEEP THIS FILE SAFE!)
- [ ] App icon uploaded (512×512)
- [ ] Feature graphic uploaded (1024×500)
- [ ] At least 2 phone screenshots uploaded
- [ ] Short + full description filled
- [ ] Privacy policy URL working publicly (test in incognito)
- [ ] Data Safety form completed
- [ ] Content rating questionnaire completed
- [ ] In-app products created and ACTIVE
- [ ] At least one license tester added (Setup → License testing)
