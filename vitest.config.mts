import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Vitest defaults to 5s. The interaction tests drive `userEvent` through
    // several steps and then poll with `findBy*`, which is comfortable on an
    // idle machine but has been seen to time out on a loaded one - a CI runner
    // sharing a box, or a laptop also running the Playwright suite. Raising
    // the ceiling removes that false failure without hiding a real one: a
    // genuinely stuck test still fails, just a few seconds later.
    testTimeout: 15_000,
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}"],
    },
  },
});
