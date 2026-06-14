import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption[] = [
    react(),
    mode === "development" ? componentTagger() : null,
    VitePWA({
      strategies: "generateSW",
      registerType: "autoUpdate",
      injectRegister: null, // registration is handled by src/lib/pwa.ts only
      filename: "sw.js",
      includeAssets: [
        "favicon.png",
        "icon-192.png",
        "icon-512.png",
        "icon-maskable-512.png",
        "manifest.webmanifest",
        "robots.txt",
      ],
      manifest: false, // we ship public/manifest.webmanifest manually
      devOptions: { enabled: false },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
        globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
        runtimeCaching: [
          // HTML navigations — always try network first, fall back to cache
          {
            urlPattern: ({ request, url }) =>
              request.mode === "navigate" && !url.pathname.startsWith("/~oauth"),
            handler: "NetworkFirst",
            options: {
              cacheName: "html-pages",
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          // Same-origin hashed JS / CSS chunks — cache-first (immutable)
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\/assets\/.+\.(?:js|css|woff2?)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Same-origin images
          {
            urlPattern: ({ url, request, sameOrigin }) =>
              sameOrigin && request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Google Fonts CSS — stale-while-revalidate
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "google-fonts-css",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          // Google Fonts files — cache-first, long-lived
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-files",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ];

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
