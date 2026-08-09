# Contributing

## Prerequisites

[Node.js](https://nodejs.org/) >= 18.

## Installation

`npm install` in the repository root installs everything needed for
development.

## Demo development server

`npm start` serves the demo app at <http://localhost:5173> with hot module
reloading. The demo imports the component straight from `src/`, so there is no
build step in the loop.

## Tests

- `npm test` — unit and integration tests (Vitest + Testing Library, jsdom).
- `npm run test:watch` — the same suite in watch mode.
- `npm run test:coverage` — writes a coverage report to `coverage/`.
- `npm run test:e2e` — browser tests (Playwright + axe). These run the demo
  against real Chromium and are the only place colour contrast is genuinely
  measured, since jsdom cannot rasterise. First run needs
  `npx playwright install chromium`.

## Formatting

Prettier formats the code; `npm install` installs a Husky pre-commit hook that
runs `eslint --fix` and `prettier --write` over staged files only, so it stays
fast. `npm run format` formats everything, `npm run format:check` verifies it,
and CI runs the check as a backstop for hooks that were bypassed or never
installed.

Markdown is deliberately excluded — Prettier pads table cells to align them,
which with the README's long image URLs produces unreadable lines. Docs are
hand-wrapped.

## Checks

- `npm run lint` — ESLint, including `jsx-a11y` accessibility rules.
- `npm run typecheck` — compiles `src/index.d.ts` against `types-test.ts` so
  the published type declarations cannot drift from the implementation.
- `npm audit --omit=dev` — must report zero vulnerabilities in runtime
  dependencies.

## Building

- `npm run build` produces `es/` (ESM), `lib/` (CommonJS) and
  `css/datePicker.css`.
- `npm run clean` deletes build output.

## Screenshots

`npm run screenshots` regenerates the images in `docs/images/` that the README
embeds. It serves `demo/screenshots.html`, freezes the browser clock and every
date on the page, then captures each labelled region, so re-running it produces
identical images rather than drifting with the current month. Regenerate them
whenever the component's appearance changes, and commit the result.

The README references those images by absolute `raw.githubusercontent.com` URL
rather than relative path, because npm serves the README from its own domain
and cannot resolve repository-relative links.

## Conventions

- The component must stay installable on React 18 and 19. Adding a runtime
  dependency that peer-locks to a narrower range is what made 0.1.x unusable,
  so avoid it. The CI `peer-compat` job installs the packed tarball against
  each supported major and will catch it.
- Accessibility changes need a matching test. WCAG regressions are treated as
  bugs, not polish.
- HIG colours live in `src/styles/_tokens.scss`. Any new colour must meet WCAG
  AA contrast (4.5:1 for text, 3:1 for non-text UI) against its background.

## Releasing

Bump, tag, push — the rest is automated:

```sh
npm version <major|minor|patch>
git push && git push --tags
```

`.github/workflows/release.yml` verifies the tag matches `package.json`, checks
the version is not already published, runs the full suite, and publishes with
provenance. See the Releasing section of `AGENTS.md` for the one-time
authentication setup.
