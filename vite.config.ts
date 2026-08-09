import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Library build. `scripts/build.mjs` runs this twice, once per module format,
// so the published package keeps the 0.x output layout (`es/` and `lib/`).
const format = process.env.LIB_FORMAT === "cjs" ? "cjs" : "es";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: format === "cjs" ? "lib" : "es",
    emptyOutDir: true,
    sourcemap: true,
    minify: false,
    target: "es2019",
    lib: {
      entry: "src/index.ts",
      formats: [format],
      fileName: () => "index.js",
    },
    rollupOptions: {
      // Everything that is not a relative import stays external, so React and
      // react-datepicker are never duplicated into a consumer's bundle.
      external: (id) => !id.startsWith(".") && !id.startsWith("/"),
      output: {
        exports: "named",
        interop: "auto",
      },
    },
  },
});
