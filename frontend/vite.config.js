import { defineConfig } from "vite";
import { dirname } from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";

if (
  process.env.npm_lifecycle_event === "build" &&
  !process.env.CI &&
  !process.env.SHOPIFY_API_KEY
) {
  throw new Error(
    "\n\nThe frontend build will not work without an API key. Set the SHOPIFY_API_KEY environment variable when running the build command, for example:" +
      "\n\nSHOPIFY_API_KEY=<your-api-key> npm run build\n"
  );
}

process.env.VITE_SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;

const proxyOptions = {
  target: "https://e43e420e9e45.ngrok-free.app",
  changeOrigin: true,
  secure: true,
  ws: false,
};

const host = process.env.HOST
  ? process.env.HOST.replace(/https?:\/\//, "")
  : "localhost";

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: "228c4be010cb.ngrok-free.app",
    port: 443,
    clientPort: 443,
  };
}

export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    host: "localhost",
    port: process.env.FRONTEND_PORT || 5173,
    hmr: hmrConfig,
    allowedHosts: [
      "localhost",
      "228c4be010cb.ngrok-free.app",
      ".ngrok-free.app"
    ],
    proxy: {
      "/api": proxyOptions,
    },
  },
  build: {
    outDir: "../backend/public",
    emptyOutDir: true,
  },
});
