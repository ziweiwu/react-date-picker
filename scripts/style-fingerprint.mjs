#!/usr/bin/env node
/**
 * Prints a hash of the *compiled* stylesheet.
 *
 * The README screenshots can only go stale if the rendered CSS changes.
 * Comparing the SCSS sources instead flags reformatting - a Prettier run that
 * rewraps a font stack changes the source but not one rendered pixel - so CI
 * compares this fingerprint between the base commit and the head instead.
 *
 *   node scripts/style-fingerprint.mjs [stylesDir]
 */
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dir = resolve(process.cwd(), process.argv[2] ?? "src/styles");

const { css } = sass.compile(resolve(dir, "datePicker.scss"), {
  loadPaths: [resolve(root, "node_modules"), dir],
  // Compressed output normalises whitespace, so source formatting cannot
  // influence the hash even indirectly.
  style: "compressed",
});

console.log(createHash("sha256").update(css).digest("hex"));
