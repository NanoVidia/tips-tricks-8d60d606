import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyPerfFlags } from "./lib/perf-flags";
import { registerServiceWorker } from "./lib/pwa";
import { ErrorBoundary } from "./components/ErrorBoundary";

applyPerfFlags();
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
registerServiceWorker();

// Global safety nets — log unhandled rejections so production crashes are
// visible in console / any installed reporter instead of failing silently.
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (e) => {
    console.error("[unhandledrejection]", e.reason);
  });
  window.addEventListener("error", (e) => {
    if (e.error) console.error("[window.error]", e.error);
  });
}
