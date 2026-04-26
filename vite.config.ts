import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const reactPath = path.resolve(__dirname, "node_modules/react");
const reactDomPath = path.resolve(__dirname, "node_modules/react-dom");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: /^react$/, replacement: path.resolve(reactPath, "index.js") },
      { find: /^react\/jsx-runtime$/, replacement: path.resolve(reactPath, "jsx-runtime.js") },
      { find: /^react\/jsx-dev-runtime$/, replacement: path.resolve(reactPath, "jsx-dev-runtime.js") },
      { find: /^react-dom$/, replacement: path.resolve(reactDomPath, "index.js") },
      { find: /^react-dom\/client$/, replacement: path.resolve(reactDomPath, "client.js") },
    ],
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    exclude: ["@radix-ui/react-tooltip"],
  },
}));
