#!/usr/bin/env node
/**
 * Regenerates the README screenshots in docs/images/.
 *
 * The browser clock is frozen and every date on the capture page is fixed, so
 * re-running this produces the same images rather than drifting with the
 * current month. Run it whenever the component's appearance changes:
 *
 *   npm run screenshots
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "docs/images");
const PORT = 5175;
const BASE = `http://127.0.0.1:${PORT}`;

// Matches SELECTED in demo/src/screenshots.tsx, so "today" and the selected
// day are stable and distinguishable.
const FROZEN_NOW = new Date("2026-08-08T12:00:00Z");

mkdirSync(outDir, { recursive: true });

const server = spawn(
  "npx",
  ["vite", "--config", "vite.demo.config.mts", "--host", "127.0.0.1", "--port", String(PORT), "--strictPort"],
  { cwd: root, stdio: "ignore" },
);

const shutdown = () => server.kill();
process.on("exit", shutdown);
process.on("SIGINT", () => { shutdown(); process.exit(1); });

async function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/screenshots.html`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("dev server did not start in time");
}

await waitForServer();

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 900 },
  deviceScaleFactor: 2, // crisp on high-DPI displays
});

// Freeze time so the "today" highlight cannot move between runs.
await page.clock.install({ time: FROZEN_NOW });
await page.goto(`${BASE}/screenshots.html`);
await page.waitForSelector("[data-shot='default']");

/** Capture one labelled region. */
async function shot(name, file) {
  await page.locator(`[data-shot='${name}']`).screenshot({
    path: resolve(outDir, file),
  });
  console.log(`  ✓ docs/images/${file}`);
}

console.log("• capturing field states");
await shot("default", "field-default.png");
await shot("filled", "field-filled.png");
await shot("instruction", "field-instruction.png");
await shot("disabled", "field-disabled.png");

console.log("• capturing keyboard focus");
// Do NOT press Escape here: react-datepicker's Escape handler blurs the
// input, which silently produced a duplicate of the unfocused shot. The
// dedicated target sets `preventOpenOnFocus` so no calendar bleeds into frame.
await page.locator("[data-shot='focused'] input").focus();
await page.waitForTimeout(400); // let the floating label transition settle
await shot("focused", "field-focused.png");

console.log("• capturing the open calendar");
await page.locator("#calendar-shot").click();
await page.waitForSelector(".react-datepicker");
await page.waitForTimeout(400);
await shot("calendar", "calendar-open.png");

console.log("• capturing hover state");
// Adjacent months render duplicate day numbers, and this stylesheet hides
// them, so the outside-month copy must be excluded or the hover never lands.
await page
  .locator(
    ".react-datepicker__day--026:not(.react-datepicker__day--outside-month)",
  )
  .hover();
await page.waitForTimeout(200);
await shot("calendar", "calendar-hover.png");

await browser.close();
server.kill();

// Two captures coming out byte-identical means an interaction silently failed
// to change the UI - which is how a "keyboard focus" shot once shipped as a
// copy of the unfocused field. Fail loudly instead.
const digests = new Map();
for (const file of readdirSync(outDir).filter((f) => f.endsWith(".png"))) {
  const hash = createHash("sha256")
    .update(readFileSync(resolve(outDir, file)))
    .digest("hex");
  const twin = digests.get(hash);
  if (twin) {
    console.error(
      `\n✗ ${file} is byte-identical to ${twin}. The interaction meant to ` +
        `distinguish them had no effect on the rendered UI.`,
    );
    process.exit(1);
  }
  digests.set(hash, file);
}

console.log(`✓ ${digests.size} distinct screenshots written to docs/images/`);
