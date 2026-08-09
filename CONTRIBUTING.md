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

## Conventions

- The component must stay installable on React 18 and 19. Adding a runtime
  dependency that peer-locks to a narrower range is what made 0.1.x unusable,
  so avoid it. The CI `peer-compat` job installs the packed tarball against
  each supported major and will catch it.
- Accessibility changes need a matching test. WCAG regressions are treated as
  bugs, not polish.
- HIG colours live in `src/styles/_tokens.scss`. Any new colour must meet WCAG
  AA contrast (4.5:1 for text, 3:1 for non-text UI) against its background.
