import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyPerfFlags } from "./lib/perf-flags";
import { registerServiceWorker } from "./lib/pwa";

applyPerfFlags();
createRoot(document.getElementById("root")!).render(<App />);
registerServiceWorker();
