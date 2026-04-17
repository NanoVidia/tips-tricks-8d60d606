import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.f15d3c7d05d949cb9278ed7124c335f7",
  appName: "tips-tricks",
  webDir: "dist",
  server: {
    url: "https://f15d3c7d-05d9-49cb-9278-ed7124c335f7.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#0ea5e9",
    },
  },
};

export default config;
