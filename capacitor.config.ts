import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.f15d3c7d05d949cb9278ed7124c335f7",
  appName: "tips-tricks",
  webDir: "dist",
  server: {
    url: "https://f15d3c7d-05d9-49cb-9278-ed7124c335f7.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  // Android-specific tuning for mid-range devices
  android: {
    // Enable hardware-accelerated mixin and let WebView use the GPU
    backgroundColor: "#f6f9fc",
    // Smooth scroll + remove default overscroll glow that costs frames
    overrideUserAgent: undefined,
    appendUserAgent: "TipsTricksAndroid",
    // Only allow remote debugging when explicitly running a debug build
    webContentsDebuggingEnabled: false,
  },
  ios: {
    backgroundColor: "#f6f9fc",
    contentInset: "automatic",
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#0ea5e9",
    },
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: "#f6f9fc",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
  },
};

export default config;
