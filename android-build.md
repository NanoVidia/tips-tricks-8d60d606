# Android Build Guide — AAB for Google Play

> Complete walkthrough to produce a signed `.aab` ready for Google Play upload,
> with Google Play Billing fully wired for the in-app subscriptions.

---

## 📛 App identity

| Field             | Value                                  |
| ----------------- | -------------------------------------- |
| Application ID    | `app.lovable.tipstricks`               |
| Display name      | `Tips & Tricks – OB/GYN`               |
| Default language  | `ar` + `en`                            |
| Category          | Medical / Education                    |

## 🔢 Version (single source of truth)

Edit **`capacitor.config.ts`** at the project root:

```ts
export const APP_VERSION_NAME = "1.0.0";
export const APP_VERSION_CODE = 1;   // increment by 1 for EVERY Play upload
```

---

## 🛠️ One-time setup (on your local machine)

You need: **Node 18+**, **Java 17**, **Android Studio** (with SDK 34+), and a Google Play Console account.

```bash
# 1. Pull the project from GitHub (use Lovable's "Export to GitHub" button first)
git clone <your-repo>
cd <your-repo>

# 2. Install dependencies
npm install

# 3. Add the Android platform (creates the /android folder)
npx cap add android

# 4. Add the Google Play Billing plugin to the native project
#    (the JS package is already in package.json: cordova-plugin-purchase)
npx cap sync android
```

### Wire `capacitor.config.ts` versions into Gradle

Open `android/app/build.gradle` and inside `android { defaultConfig { ... } }`
keep:

```gradle
applicationId "app.lovable.tipstricks"
versionCode 1            // ← bump this manually each release
versionName "1.0.0"      // ← bump this manually each release
minSdkVersion 23
targetSdkVersion 34
```

(Optional automated approach: read from `capacitor.config.ts` via a Groovy
shell call — see end of this file.)

### Add the BILLING permission

Open `android/app/src/main/AndroidManifest.xml` and add inside `<manifest>`
(above `<application>`):

```xml
<uses-permission android:name="com.android.vending.BILLING" />
<uses-permission android:name="android.permission.INTERNET" />
```

The `cordova-plugin-purchase` plugin auto-injects the BILLING permission
during `cap sync`, but keeping it explicit avoids surprises.

---

## 🎨 App icons & splash

Generate adaptive icons and splash from the existing logo:

```bash
npm install -g @capacitor/assets
npx capacitor-assets generate --android
```

This consumes `resources/icon.png` (1024×1024) and `resources/splash.png`
(2732×2732) and writes properly-sized variants under `android/app/src/main/res/`.

If you do not have those files yet, copy `public/icon-512.png` to
`resources/icon.png` and any 2732×2732 brand image to `resources/splash.png`.

---

## 🔐 Generate the signing keystore (one-time, KEEP SAFE)

```bash
keytool -genkey -v \
  -keystore tipstricks-release.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias tipstricks
```

Save the keystore file + passwords in **two safe places** (password manager + offline backup).
Losing this keystore means you can never publish updates to the same Play listing.

Configure signing in `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_PATH") ?: "../../tipstricks-release.jks")
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS") ?: "tipstricks"
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## 📦 Build the AAB

```bash
# 1. Build the React app
npm run build

# 2. Sync into Android (PRODUCTION mode — drops the dev hot-reload URL)
CAP_ENV=production npx cap sync android

# 3. Build the signed bundle
cd android
KEYSTORE_PATH=../tipstricks-release.jks \
KEYSTORE_PASSWORD=*** \
KEY_PASSWORD=*** \
./gradlew bundleRelease

# 4. Output:
#    android/app/build/outputs/bundle/release/app-release.aab
```

Upload that `.aab` to **Google Play Console → Production / Internal Testing → Create new release**.

---

## 💳 Google Play Billing — products to create

In Play Console → **Monetize → Products**, create exactly these IDs
(they MUST match `src/lib/billing/plans.ts`):

| Product ID        | Type                | Price       |
| ----------------- | ------------------- | ----------- |
| `obgyn_monthly`   | Subscription        | **$7.99 / month** |
| `obgyn_yearly`    | Subscription        | **$49.99 / year** |
| `obgyn_lifetime`  | Managed product (one-time) | **$119.99** |

For each subscription, add a **base plan** with:
- Billing period: monthly / yearly
- **Free trial offer**: 7 days

---

## 🔁 Server-side verification (next step)

After your first AAB is uploaded:

1. In **Google Cloud Console** → enable **Google Play Android Developer API**.
2. Create / reuse a **Service Account** with role `Service Account User`.
3. In **Play Console → Users and permissions**, invite that service account
   email and grant: *View financial data*, *Manage orders and subscriptions*.
4. Download the JSON key.
5. Paste it as the secret `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` here in Lovable.
6. We then deploy two edge functions (already prepared in app code):
   - `verify-purchase` — server-validates every purchase token
   - `play-rtdn-webhook` — receives Real-time Developer Notifications
7. In Play Console → **Monetization setup → Cloud Pub/Sub topic**, paste the
   webhook URL printed by Lovable Cloud after deploy.

---

## ✅ Final checklist before upload

- [ ] `versionCode` higher than the previous Play upload
- [ ] `CAP_ENV=production` was set during `cap sync` (no preview URL inside the APK)
- [ ] Signed with the release keystore
- [ ] Three products created in Play Console with exact IDs above
- [ ] Privacy Policy URL set in Play listing → `https://tips-tricks.lovable.app/privacy`
- [ ] Data safety form filled in Play Console
- [ ] Content rating questionnaire completed
- [ ] Screenshots (min 2 phone screenshots, 1080×1920)
- [ ] Feature graphic 1024×500
- [ ] App icon 512×512

---

## ✅ Google Play 2025 compliance checklist

- **`targetSdkVersion = 34`** (or higher) — required since Aug 2025.
  In `android/app/build.gradle` ensure:
  ```gradle
  android {
    compileSdk 34
    defaultConfig { targetSdk 34; minSdk 23 }
  }
  ```
- **Android 13+ notifications** — add to `android/app/src/main/AndroidManifest.xml`:
  ```xml
  <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
  ```
- **Restore Purchases** button is wired in the app footer (`SafeHome.tsx`).
- **Privacy / Terms / Disclaimer** are publicly accessible (no login) at
  `/privacy.html`, `/terms.html`, and inside the in-app *Info & Legal* hub.
- **Data Safety form** (Play Console): declare email (auth), purchase data,
  and FCM/local notifications.
- **Content rating**: target *Everyone* — keep SAFE_MODE on for review.
