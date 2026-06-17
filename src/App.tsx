import { lazy, Suspense, useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { FreezeOverlay } from "./components/FreezeOverlay";
import { useLocalNotifications } from "./hooks/useLocalNotifications";

const Index = lazy(() => import("./pages/Index.tsx"));
const Tools = lazy(() => import("./pages/Tools.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Control = lazy(() => import("./pages/Control.tsx"));
const ControlLoginPage = lazy(() => import("./pages/ControlLoginPage.tsx"));
const Exams = lazy(() => import("./pages/Exams.tsx"));
const ExamsCompare = lazy(() => import("./pages/ExamsCompare.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const Disclaimer = lazy(() => import("./pages/Disclaimer.tsx"));
const About = lazy(() => import("./pages/About.tsx"));
const MenuPage = lazy(() => import("./pages/MenuPage.tsx"));
const MenuHub = lazy(() => import("./pages/MenuHub.tsx"));
const KeystoreSetup = lazy(() => import("./pages/KeystoreSetup.tsx"));
import { DisclaimerSplash, useDisclaimer } from "./components/DisclaimerSplash";
import { BottomTabBar } from "./components/BottomTabBar";
import { FloatingBackButton } from "./components/FloatingBackButton";
import { AccessGate } from "./components/AccessGate";
import { GlobalTrialBanner } from "./components/GlobalTrialBanner";
import { AutoPaywall } from "./components/AutoPaywall";
import { useTrialExpiryNotification } from "./hooks/useTrialExpiryNotification";
import { useNativeBootstrap } from "./hooks/useNativeBootstrap";
import { useNotificationTapHandler } from "./hooks/useNotificationTapHandler";
import { SAFE_MODE } from "./lib/safeMode";
const SafeHome = lazy(() => import("./pages/SafeHome.tsx"));

function NotificationsBootstrap() {
  useLocalNotifications();
  useTrialExpiryNotification();
  useNativeBootstrap();
  return null;
}

/** Mounted inside <BrowserRouter> so it can call useNavigate. */
function RouterNotificationBridge() {
  useNotificationTapHandler();
  return null;
}



// App freeze state — controlled only from here and not connected to the database.
// Set true to freeze the published app for visitors; set false to unfreeze it.
// Developers can override with ?dev=1 and lock again with ?dev=0.
const APP_FROZEN = false;
const DEV_KEY = "dev_unlock";

const App = () => {
  const [devUnlocked, setDevUnlocked] = useState(false);
  const { accepted: disclaimerAccepted, accept: acceptDisclaimer } = useDisclaimer();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dev") === "1") localStorage.setItem(DEV_KEY, "1");
    if (params.get("dev") === "0") localStorage.removeItem(DEV_KEY);
    setDevUnlocked(localStorage.getItem(DEV_KEY) === "1");

    // Restore accessibility preferences
    if (localStorage.getItem("a11y_reduce") === "1") document.documentElement.classList.add("reduce-motion");
    if (localStorage.getItem("a11y_large") === "1") document.documentElement.classList.add("large-text");

    // Auto-detect low-end devices (Android mid-range) and enable performance mode.
    import("./lib/perfMode").then((m) => m.applyPerformanceMode());

    // Defer non-critical work (billing init, etc.) until the main thread is idle —
    // keeps cold-start fast on mobile by not blocking first paint.
    const idle: (cb: () => void) => void =
      (window as any).requestIdleCallback?.bind(window) ??
      ((cb: () => void) => setTimeout(cb, 1200));
    idle(() => {
      // Server-side trial reconciliation — prevents trial reset by clearing
      // app data or rolling back the device clock.
      import("./lib/billing/trial").then((m) => m.syncTrialWithServer().catch(() => {}));

      import("./lib/billing/store").then((m) => {
        m.initStore()
          .then(() => {
            // Silent auto-restore on every cold start — recovers entitlement
            // on reinstall, cache wipe, or device change with same Play account.
            if (m.isBillingAvailable()) {
              m.restore().catch((err) => console.warn("[billing] auto-restore failed", err));
            }
          })
          .catch((err) => console.warn("[billing] init failed", err));
      });
    });
  }, []);

  // Auto-unlock in Lovable preview/sandbox environments.
  // Only the published domain remains frozen for visitors when APP_FROZEN is true.
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLovablePreview =
    hostname.includes("id-preview--") ||
    hostname.includes("lovableproject.com") ||
    hostname.endsWith(".lovable.dev") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1";

  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const onAdminPanel = path.startsWith("/admin") || path.startsWith("/control");
  const showFreeze = APP_FROZEN && !devUnlocked && !onAdminPanel && !isLovablePreview;

  // SAFE MODE: render only the non-clinical quiz page.
  // Hides all clinical routes, disclaimer, bottom tabs, and back button.
  if (SAFE_MODE) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <NotificationsBootstrap />
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <SafeHome />
          </Suspense>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NotificationsBootstrap />
          <RouterNotificationBridge />
          <GlobalTrialBanner />
          <AutoPaywall />
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/index" element={<Index />} />
              <Route path="/tools" element={<AccessGate featureLabel="Clinical Tools"><Tools /></AccessGate>} />
              <Route path="/saved" element={<AccessGate featureLabel="Saved Items"><Tools /></AccessGate>} />
              <Route path="/exams" element={<AccessGate featureLabel="Exams &amp; Question Bank"><Exams /></AccessGate>} />
              <Route path="/exams/compare" element={<AccessGate featureLabel="Exam Comparison"><ExamsCompare /></AccessGate>} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/control/login" element={<ControlLoginPage />} />
              <Route path="/control" element={<Control />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/about" element={<About />} />
              <Route path="/menu" element={<MenuHub />} />
              <Route path="/menu/:pageId" element={<MenuPage />} />
              <Route path="/keystore-setup" element={<KeystoreSetup />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <FloatingBackButton />
          <BottomTabBar />
        </BrowserRouter>
        {showFreeze && <FreezeOverlay />}
        {!disclaimerAccepted && !onAdminPanel && <DisclaimerSplash onAccept={acceptDisclaimer} />}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
