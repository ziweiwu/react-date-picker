#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const run = (cmd, args, env) =>
  execFileSync(cmd, args, { cwd: root, stdio: "inherit", env: { ...process.env, ...env } });

console.log("• cleaning");
for (const dir of ["es", "lib", "css"]) {
  rmSync(resolve(root, dir), { recursive: true, force: true });
}

console.log("• building ESM -> es/");
run("npx", ["vite", "build"], { LIB_FORMAT: "es" });

console.log("• building CJS -> lib/");
run("npx", ["vite", "build"], { LIB_FORMAT: "cjs" });

console.log("• compiling SCSS -> css/datePicker.css");
mkdirSync(resolve(root, "css"), { recursive: true });
const { css, sourceMap } = sass.compile(resolve(root, "src/styles/datePicker.scss"), {
  loadPaths: [resolve(root, "node_modules"), resolve(root, "src/styles")],
  sourceMap: true,
  style: "expanded",
});
writeFileSync(
  resolve(root, "css/datePicker.css"),
  `${css}\n/*# sourceMappingURL=datePicker.css.map */\n`,
);
writeFileSync(
  resolve(root, "css/datePicker.css.map"),
  JSON.stringify(sourceMap),
);

// Node decides a .js file's module system from the nearest package.json
// "type" field, not from the `exports` condition that resolved it. Without
// these markers `import "react-hig-datepicker"` would load es/index.js as
// CommonJS and fail on the first `export` statement.
console.log("• marking module types");
writeFileSync(
  resolve(root, "es/package.json"),
  `${JSON.stringify({ type: "module" }, null, 2)}\n`,
);
writeFileSync(
  resolve(root, "lib/package.json"),
  `${JSON.stringify({ type: "commonjs" }, null, 2)}\n`,
);

console.log("• emitting type declarations");
for (const dir of ["es", "lib"]) {
  copyFileSync(resolve(root, "src/index.d.ts"), resolve(root, dir, "index.d.ts"));
}

console.log("✓ build complete");
