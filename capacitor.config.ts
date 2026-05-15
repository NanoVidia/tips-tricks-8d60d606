import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration — base build metadata.
 *
 * App identity (used by Google Play & App Store):
 *  - appId        → Application ID / Package name (UNCHANGEABLE after first publish)
 *  - appName      → Display name on the device home screen
 *
 * Versioning (must be bumped for every Play Store upload):
 *  - versionName  → Public version shown to users (e.g. "1.0.0")
 *  - versionCode  → Internal integer; MUST increase on every upload
 *
 * To produce a signed AAB for Google Play:
 *   npm run build && npx cap sync android
 *   cd android && ./gradlew bundleRelease
 *   # Output: android/app/build/outputs/bundle/release/app-release.aab
 *
 * NOTE: versionName / versionCode below are read by a small Gradle hook
 * (see android/app/build.gradle snippet in the README) so you can manage
 * them from one place instead of editing build.gradle each time.
 */
export const APP_VERSION_NAME = "1.0.2";
export const APP_VERSION_CODE = 3;

// 🌐 OTA Updates — APK يُحمّل دائماً من رابط النشر المباشر
// أي تحديث تنشره من Lovable (Publish → Update) يظهر فوراً للمستخدمين
// بدون الحاجة لبناء APK جديد. العيب: التطبيق يحتاج إنترنت للعمل.
//
// CAP_ENV=production  → يحمّل من https://tips-tricks.lovable.app (OTA)
// CAP_ENV=development → يحمّل من sandbox preview (hot-reload أثناء التطوير)
const isProduction = process.env.CAP_ENV === "production";

const PROD_URL = "https://tips-tricks.lovable.app";
const DEV_URL = "https://f15d3c7d-05d9-49cb-9278-ed7124c335f7.lovableproject.com?forceHideBadge=true";

const config: CapacitorConfig = {
  // ---- Identity ----
  appId: "app.lovable.tipstricks",
  appName: "Tips & Tricks Daily Quiz",

  // ---- Web build output (fallback إذا فشل تحميل OTA) ----
  webDir: "dist",

  // ---- OTA / hot-reload server ----
  server: {
    url: isProduction ? PROD_URL : DEV_URL,
    cleartext: !isProduction,
    androidScheme: "https",
  },

  // ---- Android tuning ----
  android: {
    backgroundColor: "#ffffff",
    appendUserAgent: "TipsTricksAndroid",
    webContentsDebuggingEnabled: false,
    allowMixedContent: false,
  },

  // ---- iOS tuning ----
  ios: {
    backgroundColor: "#ffffff",
    contentInset: "automatic",
  },

  // ---- Plugins ----
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#0ea5e9",
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
  },
};

export default config;
