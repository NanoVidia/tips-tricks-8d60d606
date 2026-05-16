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
Daily learning & coaching tips for OB/GYN and fertility professionals.
```

## Full description (max 4000 chars)

```
Tips & Tricks delivers daily learning and coaching tips designed for
qualified professionals in obstetrics, gynecology and fertility care.

Think of it as your pocket-sized professional-development companion — a calm,
distraction-free space where you sharpen knowledge, test yourself and get
quick coaching prompts you can use during training, study sessions or between
clinic visits.

Every day brings a fresh mix of:

🧠  DAILY QUIZ
Short self-assessment questions with instant explanations to reinforce key
concepts and track your learning streak.

✨  INSPIRATION
Daily reflections and motivational prompts tailored for professionals in
women's health and fertility practice.

🎓  STUDY SETS
Curated quick-review packs for exam prep, board review and ongoing
professional education.

🌍  DISCOVER
Bite-sized reference notes, career-coaching tips and practice pearls you can
read in under five minutes.

WHAT IT IS NOT
• Not a medical device, diagnostic aid or treatment planner.
• Not a source of patient-care instructions or clinical-decision support.
• Not intended for use by patients or the general public.

WHO IT'S FOR
Adult professionals and trainees in women's health — including residents,
fellows, consultants, educators and exam candidates who want a lightweight,
daily learning resource.

WHY YOU'LL LIKE IT
• Beautifully simple, distraction-free design
• Works fully offline once installed
• No ads, no trackers, no spam
• Optional gentle reminders so you never miss a day
• Restore Purchases supported (Google Play Billing)

PRIVACY-FIRST
Your quiz progress stays on your device. We don't sell your data. We don't run
ads. The app collects only what's needed for sign-in and purchases.

DISCLAIMER
This app provides general professional-education and coaching content only.
It is NOT medical, legal or financial advice. Nothing here replaces formal
training, institutional protocols or consultation with a qualified specialist.
Always rely on your clinical judgment and local guidelines for real-world
decisions.

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
