import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev server + static build for the demo page in `demo/`.
export default defineConfig({
  root: "demo",
  plugins: [react()],
  css: {
    preprocessorOptions: {
      scss: { loadPaths: ["node_modules"] },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
