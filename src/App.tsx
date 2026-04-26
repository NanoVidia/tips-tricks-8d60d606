import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Tools from "./pages/Tools.tsx";
import Admin from "./pages/Admin.tsx";
import Control from "./pages/Control.tsx";
import Exams from "./pages/Exams.tsx";
import ExamsCompare from "./pages/ExamsCompare.tsx";
import NotFound from "./pages/NotFound.tsx";
import { FreezeOverlay } from "./components/FreezeOverlay";
import { useLocalNotifications } from "./hooks/useLocalNotifications";

function NotificationsBootstrap() {
  useLocalNotifications();
  return null;
}

const queryClient = new QueryClient();

// App freeze state — controlled only from here and not connected to the database.
// Set true to freeze the published app for visitors; set false to unfreeze it.
// Developers can override with ?dev=1 and lock again with ?dev=0.
const APP_FROZEN = false;
const DEV_KEY = "dev_unlock";

const App = () => {
  const [devUnlocked, setDevUnlocked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dev") === "1") localStorage.setItem(DEV_KEY, "1");
    if (params.get("dev") === "0") localStorage.removeItem(DEV_KEY);
    setDevUnlocked(localStorage.getItem(DEV_KEY) === "1");

    // Restore accessibility preferences
    if (localStorage.getItem("a11y_reduce") === "1") document.documentElement.classList.add("reduce-motion");
    if (localStorage.getItem("a11y_large") === "1") document.documentElement.classList.add("large-text");
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
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tools" element={<Tools />} />
            <Route path="/exams" element={<Exams />} />
            <Route path="/exams/compare" element={<ExamsCompare />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/control" element={<Control />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        {showFreeze && <FreezeOverlay />}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
