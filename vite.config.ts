import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [react(), mode === "development" ? componentTagger() : null];

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/query-core"],
    },
    build: {
      target: "es2020",
      cssCodeSplit: true,
      sourcemap: false,
      minify: "esbuild",
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules/react") || id.includes("react-router-dom")) return "vendor-react";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("@supabase/supabase-js")) return "vendor-supabase";
            if (id.includes("@tanstack/react-query") || id.includes("@tanstack/query-core")) return "vendor-query";
            if (id.includes("lucide-react")) return "vendor-icons";
            return undefined;
          },
        },
      },
    },
  };
});
