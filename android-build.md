# Android Build Settings (AAB for Google Play)

> Source of truth for app identity & versioning lives in
> **`capacitor.config.ts`** (root) and **`public/manifest.webmanifest`**.

## 📛 App identity

| Field             | Value                                  |
| ----------------- | -------------------------------------- |
| Application ID    | `app.lovable.tipstricks`               |
| Display name      | `Tips & Tricks`                        |
| Default language  | `en` (with Arabic content support)     |
| Category          | Education                              |
| Description       | Fun daily quizzes with tips, history, language and career knowledge. Educational entertainment only. |

## 🔢 Version

| Field         | Current | Notes                                            |
| ------------- | ------- | ------------------------------------------------ |
| `versionName` | `1.0.0` | Shown to users in Play Store                     |
| `versionCode` | `1`     | **Must increment by 1 for every Play upload**    |

Bump rules:
- **Patch** (1.0.0 → 1.0.1) — bug fixes, copy tweaks → `versionCode + 1`
- **Minor** (1.0.0 → 1.1.0) — new features → `versionCode + 1`
- **Major** (1.0.0 → 2.0.0) — breaking redesign → `versionCode + 1`

## ⚙️ Wire versions into `android/app/build.gradle`

After running `npx cap add android` once, open
`android/app/build.gradle` and replace the static `versionCode` /
`versionName` lines inside `defaultConfig` with this snippet so they
read from `capacitor.config.ts`:

```gradle
def capacitorConfig = new groovy.json.JsonSlurper().parse(
    ["node", "-e",
     "const c=require('./../../capacitor.config.ts'); " +
     "console.log(JSON.stringify({n:c.APP_VERSION_NAME,c:c.APP_VERSION_CODE}))"
    ].execute().text.trim() ?: '{"n":"1.0.0","c":1}'
)

android {
    defaultConfig {
        applicationId "app.lovable.tipstricks"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1            // ← bump manually OR use capacitorConfig.c
        versionName "1.0.0"      // ← bump manually OR use capacitorConfig.n
    }
}
```

> If the Groovy hook above feels fragile, just edit `versionCode` and
> `versionName` directly in `build.gradle` before each release — it's
> two lines and 10 seconds.

## 🏗️ Build a release AAB

```bash
# 1. Build the web bundle
npm run build

# 2. Remove the dev `server.url` from capacitor.config.ts (or comment it out)
#    so the AAB ships the local dist/ instead of pointing at Lovable.

# 3. Sync into Android
npx cap sync android

# 4. Generate the signed AAB
cd android
./gradlew bundleRelease

# Output:
# android/app/build/outputs/bundle/release/app-release.aab
```

Upload `app-release.aab` to **Google Play Console → Production → Create new release**.

## 🔐 Signing key (one-time)

```bash
keytool -genkey -v -keystore tips-tricks.keystore \
  -alias tipstricks -keyalg RSA -keysize 2048 -validity 10000
```

Store the keystore + passwords in a safe place (password manager).
Lose it = you can never update the same Play listing again.

Add to `android/key.properties` (do NOT commit):

```properties
storeFile=../tips-tricks.keystore
storePassword=YOUR_STORE_PASSWORD
keyAlias=tipstricks
keyPassword=YOUR_KEY_PASSWORD
```

And reference it in `android/app/build.gradle` `signingConfigs.release`.
