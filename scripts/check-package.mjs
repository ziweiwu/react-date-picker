#!/usr/bin/env node
/**
 * Asserts that the tarball npm would publish is actually usable.
 *
 * This exists because 0.1.8 shipped raw `.scss` and test files in `lib/` and
 * `es/` but no compiled CSS, so the `lib/datePicker.css` import the README
 * documented 404'd for consumers for two years. Nothing caught it, because
 * `npm publish` succeeding says nothing about the contents being right.
 *
 * Run after `npm run build`. `prepublishOnly` and CI both do.
 */
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const raw = execFileSync("npm", ["pack", "--dry-run", "--json"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});
const paths = JSON.parse(raw)[0].files.map((f) => f.path);

/** Files that must be present for the package to work at all. */
const required = [
  "package.json",
  "README.md",
  "LICENSE",
  "lib/index.js", // CommonJS entry
  "lib/index.d.ts", // types, per package.json "types"
  "lib/package.json", // marks CJS; without it Node may misread the entry
  "es/index.js", // ESM entry
  "es/package.json", // marks ESM; without it `import` throws on `export`
  "css/datePicker.css", // the file 0.1.8 forgot
];

/** Patterns that must NOT appear. */
const forbidden = [
  { label: "test files", re: /\.test\.[cm]?[jt]sx?$/ },
  { label: "spec files", re: /\.spec\.[cm]?[jt]sx?$/ },
  { label: "snapshots", re: /__snapshots__\// },
  { label: "uncompiled CSS in lib/ or es/", re: /^(lib|es)\/.*\.scss$/ },
  { label: "e2e tests", re: /^e2e\// },
  { label: "CI config", re: /^\.github\// },
  { label: "env files", re: /(^|\/)\.env/ },
  { label: "npm/yarn credentials", re: /(^|\/)\.npmrc$|(^|\/)\.yarnrc/ },
];

const problems = [];

for (const file of required) {
  if (!paths.includes(file)) problems.push(`missing required file: ${file}`);
}

for (const { label, re } of forbidden) {
  const hits = paths.filter((p) => re.test(p));
  if (hits.length)
    problems.push(`${label} should not ship: ${hits.join(", ")}`);
}

// The CSS must actually contain rules; an empty file would satisfy the
// presence check above while still leaving consumers unstyled.
const css = JSON.parse(raw)[0].files.find(
  (f) => f.path === "css/datePicker.css",
);
if (css && css.size < 1000) {
  problems.push(`css/datePicker.css looks empty (${css.size} bytes)`);
}

if (problems.length) {
  console.error("✗ package contents check failed:\n");
  for (const p of problems) console.error(`  - ${p}`);
  console.error(`\n${paths.length} files in tarball:\n`);
  for (const p of paths.sort()) console.error(`  ${p}`);
  process.exit(1);
}

console.log(`✓ package contents OK (${paths.length} files)`);
