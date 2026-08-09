#!/usr/bin/env node
/**
 * Records the animated README demo (docs/images/demo.gif).
 *
 * Playwright records the viewport as webm, ffmpeg turns it into a GIF. The
 * browser clock is pinned to the same month the interaction script clicks in,
 * so the recording never drifts with the real calendar:
 *
 *   npm run demo:gif
 *
 * Requires ffmpeg on PATH (brew install ffmpeg).
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "docs/images");
const outFile = resolve(outDir, "demo.gif");
const PORT = 5176;
const BASE = `http://127.0.0.1:${PORT}`;
const SIZE = { width: 420, height: 440 };

// Matches demo/src/demo-capture.tsx's month and the days clicked below.
const FROZEN_NOW = new Date("2026-08-08T12:00:00Z");

if (spawnSync("ffmpeg", ["-version"], { stdio: "ignore" }).status !== 0) {
  console.error("✗ ffmpeg not found on PATH. Install it: brew install ffmpeg");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });
const workDir = mkdtempSync(resolve(tmpdir(), "hig-datepicker-demo-"));

const server = spawn(
  "npx",
  [
    "vite",
    "--config",
    "vite.demo.config.ts",
    "--host",
    "127.0.0.1",
    "--port",
    String(PORT),
    "--strictPort",
  ],
  { cwd: root, stdio: "ignore" },
);
const shutdown = () => server.kill();
process.on("exit", shutdown);
process.on("SIGINT", () => {
  shutdown();
  process.exit(1);
});

async function waitForServer(timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(`${BASE}/demo-capture.html`)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("dev server did not start in time");
}
await waitForServer();

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: SIZE,
  recordVideo: { dir: workDir, size: SIZE },
});

// Playwright's synthetic mouse leaves no visible pointer, so the recording
// would show the UI reacting to nothing. Draw one that follows the real
// mousemove events the driver dispatches.
await context.addInitScript(() => {
  const draw = () => {
    const el = document.createElement("div");
    el.id = "__cursor";
    el.innerHTML =
      '<svg width="22" height="26" viewBox="0 0 22 26" fill="none">' +
      '<path d="M2 1.6 19 12.4 11.4 13.6 15 22.2 12 23.4 8.4 15 3 20z" ' +
      'fill="#1a1a1a" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/>' +
      "</svg>";
    Object.assign(el.style, {
      position: "fixed",
      top: "0",
      left: "0",
      zIndex: "2147483647",
      pointerEvents: "none",
      transition: "transform 40ms linear",
      filter: "drop-shadow(0 1px 2px rgba(0,0,0,.35))",
      transform: "translate(-100px, -100px)",
    });
    document.body.appendChild(el);

    addEventListener(
      "mousemove",
      (e) => {
        el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
      },
      true,
    );
    // A click is otherwise invisible in a silent GIF: flash a ring at the point.
    addEventListener(
      "mousedown",
      (e) => {
        const ring = document.createElement("div");
        Object.assign(ring.style, {
          position: "fixed",
          left: `${e.clientX}px`,
          top: `${e.clientY}px`,
          width: "0px",
          height: "0px",
          border: "2px solid #0696d7",
          borderRadius: "50%",
          zIndex: "2147483646",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          transition:
            "width 320ms ease-out, height 320ms ease-out, opacity 320ms ease-out",
          opacity: "1",
        });
        document.body.appendChild(ring);
        requestAnimationFrame(() => {
          ring.style.width = "44px";
          ring.style.height = "44px";
          ring.style.opacity = "0";
        });
        setTimeout(() => ring.remove(), 400);
      },
      true,
    );
  };
  if (document.body) draw();
  else addEventListener("DOMContentLoaded", draw);
});

// The video starts rolling the moment the page exists, so the pre-mount blank
// frames are part of it. Measure them and trim exactly that much off the head.
const recordingStart = Date.now();
const page = await context.newPage();
// setFixedTime pins Date without faking timers, so CSS/rAF animations still run
// (clock.install would freeze the transitions this recording exists to show).
await page.clock.setFixedTime(FROZEN_NOW);
await page.goto(`${BASE}/demo-capture.html`);
await page.waitForSelector("#demo-picker");
const blankLeadIn = (Date.now() - recordingStart) / 1000;

const wait = (ms) => page.waitForTimeout(ms);
let at = { x: 380, y: 400 };

/** Move the pointer in small steps so the recording shows travel, not teleport. */
async function glide(target, steps = 22) {
  const locator =
    typeof target === "string"
      ? page.locator(target)
      : target.boundingBox
        ? target
        : null;
  const box = locator ? await locator.boundingBox() : null;
  if (locator && !box)
    throw new Error(`glide target is not visible: ${locator}`);
  const to = box
    ? { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    : target;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; // ease-in-out
    await page.mouse.move(
      at.x + (to.x - at.x) * ease,
      at.y + (to.y - at.y) * ease,
    );
    await wait(12);
  }
  at = to;
}
async function clickHere() {
  await page.mouse.down();
  await wait(70);
  await page.mouse.up();
}

const day = (n) =>
  `.react-datepicker__day--0${n}:not(.react-datepicker__day--outside-month)`;

console.log("• recording: open the calendar");
await page.mouse.move(at.x, at.y);
await wait(900);
await glide("#demo-picker");
await clickHere();
await page.waitForSelector(".react-datepicker");
await wait(700);

console.log("• recording: browse and pick a day");
for (const n of ["12", "19"]) {
  await glide(day(n), 14);
  await wait(420);
}
await glide(day("20"), 12);
await wait(500);
await clickHere();
await wait(1500);

console.log("• recording: clear the value");
await glide(page.locator(".hig__text-field-v1__clear button"), 18);
await wait(500);
await clickHere();
await wait(1300);

console.log("• recording: keyboard selection");
await glide({ x: 390, y: 415 }, 16); // park the pointer out of the way
await page.locator("#demo-picker").focus();
await page.waitForSelector(".react-datepicker");
await page.waitForSelector(".react-datepicker__day--keyboard-selected");
await wait(800);
// The leading ArrowDown is load-bearing: while the input holds focus,
// react-datepicker only handles ArrowUp/ArrowDown (they move focus into the
// day grid). ArrowLeft/ArrowRight pressed first are silently dropped, which is
// how this recording once showed four key presses moving the cursor one day.
await page.keyboard.press("ArrowDown");
await page.waitForSelector(".react-datepicker__day--keyboard-selected:focus");
await wait(500);
for (const key of ["ArrowRight", "ArrowRight", "ArrowDown", "ArrowRight"]) {
  await page.keyboard.press(key);
  await wait(500);
}
await page.keyboard.press("Enter");
await wait(1800);

await context.close(); // flushes the video file
await browser.close();
server.kill();

const video = readdirSync(workDir).find((f) => f.endsWith(".webm"));
if (!video) throw new Error("playwright wrote no video");

console.log("• encoding gif");
const filters =
  "fps=15,scale=420:-1:flags=lanczos,split[s0][s1];" +
  "[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle";
const ff = spawnSync(
  "ffmpeg",
  [
    "-y",
    "-ss",
    blankLeadIn.toFixed(2),
    "-i",
    resolve(workDir, video),
    "-vf",
    filters,
    "-loop",
    "0",
    outFile,
  ],
  { stdio: "inherit" },
);
rmSync(workDir, { recursive: true, force: true });
if (ff.status !== 0) process.exit(ff.status ?? 1);

const kb = Math.round(statSync(outFile).size / 1024);
console.log(`✓ docs/images/demo.gif (${kb} KB)`);
// A README GIF is downloaded on every page view; keep it honest.
if (kb > 3072)
  console.warn(`! ${kb} KB is large for a README - shorten the sequence.`);
