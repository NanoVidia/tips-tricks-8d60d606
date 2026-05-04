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
import { DisclaimerSplash, useDisclaimer } from "./components/DisclaimerSplash";
import { BottomTabBar } from "./components/BottomTabBar";

function NotificationsBootstrap() {
  useLocalNotifications();
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NotificationsBootstrap />
          <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/index" element={<Index />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/exams/compare" element={<ExamsCompare />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/control/login" element={<ControlLoginPage />} />
              <Route path="/control" element={<Control />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/about" element={<About />} />
              <Route path="/menu" element={<MenuHub />} />
              <Route path="/menu/:pageId" element={<MenuPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <BottomTabBar />
        </BrowserRouter>
        {showFreeze && <FreezeOverlay />}
        {!disclaimerAccepted && !onAdminPanel && <DisclaimerSplash onAccept={acceptDisclaimer} />}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
