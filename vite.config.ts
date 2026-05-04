import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const reactQueryPath = path.resolve(__dirname, "node_modules/@tanstack/react-query/build/modern/index.js");
const queryCorePath = path.resolve(__dirname, "node_modules/@tanstack/query-core/build/modern/index.js");

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
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@tanstack/react-query": reactQueryPath,
      "@tanstack/query-core": queryCorePath,
    },
    dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/query-core"],
  },
  optimizeDeps: {
    force: true,
    exclude: ["react", "react-dom", "@tanstack/react-query", "@tanstack/query-core", "@radix-ui/react-tooltip"],
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    minify: "esbuild",
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split heavy vendors into their own chunks so the initial bundle is small
        // and routes can stream in parallel — critical for mid-range Android.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-motion": ["framer-motion"],
          "vendor-supabase": ["@supabase/supabase-js"],
          "vendor-query": ["@tanstack/react-query", "@tanstack/query-core"],
          "vendor-icons": ["lucide-react"],
        },
      },
    },
  },
}));
