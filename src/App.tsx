import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
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
const DEV_KEY = "dev_unlock";

// قراءة حالة التجميد من app_settings.app_frozen مع fallback إلى true (سلوك قديم آمن).
function useFrozenFlag(): boolean {
  const q = useQuery({
    queryKey: ["app_settings", "app_frozen"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "app_frozen")
        .maybeSingle();
      // value مخزّن كـ jsonb (true/false). نحوّله إلى boolean.
      return Boolean(data?.value);
    },
    staleTime: 60_000,
    retry: 0,
  });
  // أثناء التحميل وعند الخطأ → نعتبر التطبيق مُجمَّداً (آمن للزائر).
  return q.data ?? true;
}

function FrozenGate() {
  const frozen = useFrozenFlag();
  const [devUnlocked, setDevUnlocked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("dev") === "1") localStorage.setItem(DEV_KEY, "1");
    if (params.get("dev") === "0") localStorage.removeItem(DEV_KEY);
    setDevUnlocked(localStorage.getItem(DEV_KEY) === "1");
  }, []);

  const hostname = typeof window !== "undefined" ? window.location.hostname : "";
  const isLovablePreview =
    hostname.includes("id-preview--") ||
    hostname.includes("lovableproject.com") ||
    hostname.endsWith(".lovable.dev") ||
    hostname === "localhost" ||
    hostname === "127.0.0.1";

  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const onAdminPanel = path.startsWith("/admin") || path.startsWith("/control");
  const showFreeze = frozen && !devUnlocked && !onAdminPanel && !isLovablePreview;

  return showFreeze ? <FreezeOverlay /> : null;
}

const App = () => {
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
        <FrozenGate />
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
