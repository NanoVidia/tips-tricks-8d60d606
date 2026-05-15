import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyPerfFlags } from "./lib/perf-flags";

applyPerfFlags();
createRoot(document.getElementById("root")!).render(<App />);

// إخفاء Splash فوراً على الأجهزة الأصلية — لا توجد شاشة بداية بطيئة
(async () => {
  try {
    const { Capacitor } = await import("@capacitor/core").catch(() => ({ Capacitor: null as any }));
    if (!Capacitor?.isNativePlatform?.()) return;
    const { SplashScreen } = await import("@capacitor/splash-screen").catch(() => ({ SplashScreen: null as any }));
    if (SplashScreen) await SplashScreen.hide({ fadeOutDuration: 0 });
  } catch { /* ignore */ }
})();
