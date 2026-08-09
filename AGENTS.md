# AGENTS.md

> Guidance for coding agents working in this repo. `CLAUDE.md` imports this
> file, so edit **this** file — never `CLAUDE.md`.

A date picker with Autodesk HIG styling, wrapping `react-datepicker`. Written in
TypeScript, published to npm as `react-hig-datepicker`.

The repo went from unusable to 1.0 in one pass (see `CHANGELOG.md`). Most of
what follows is there to stop that work being undone by a plausible-looking
change.

## Commands

```sh
npm start          # demo at localhost:5173, imports straight from src/
npm test           # 23 unit tests (Vitest + Testing Library, jsdom)
npm run test:e2e   # 7 browser tests (Playwright + axe); needs `npx playwright install chromium`
npm run lint       # ESLint incl. jsx-a11y
npm run typecheck  # type-checks src, tests, e2e, demo and configs
npm run build      # -> es/ (ESM), lib/ (CJS), css/datePicker.css
npm run audit      # runtime deps only; must be 0 before any release
npm run check:package  # asserts the tarball npm would publish is usable
```

## Invariants

Breaking any of these reintroduces a bug that was already shipped once. All are
covered by an automated check; if you change the behaviour deliberately, change
the check in the same commit rather than deleting it.

1. **The input is `readOnly`, never `disabled`** (unless the caller passes
   `disabled`). 0.1.x hardcoded `disabled`, which made the picker unreachable by
   keyboard, invisible to screen readers, and — via HIG's `--disabled` rule —
   silently hid the clear button so `showClearButton` did nothing.

2. **`readOnly` must NOT be forwarded to `ReactDatePicker`.** Since v9 it also
   suppresses *opening* the calendar (`onInputClick` and `handleFocus` both gate
   on it), not just typing. It is applied to the `<input>` inside
   `TextField.jsx` instead. This is the single easiest thing to "clean up" and
   break.

3. **Every instance gets a unique input id**, and `<label for>` resolves to it.
   0.1.x hardcoded `id="hig__date-picker"` on all instances.

4. **`TextField` forwards its ref to the DOM `<input>`.** `react-datepicker`
   clones the custom input and calls `.focus()` on whatever the ref resolves to.

5. **Colour tokens meet WCAG AA** — 4.5:1 for text, 3:1 for non-text UI. All
   colours live in `src/styles/_tokens.scss` with their measured ratios in
   comments. Do not introduce a colour anywhere else.

6. **Visible `:focus-visible` indicators** on input, clear button and month
   navigation. 0.1.x set `outline: 0`.

7. **The published tarball ships no test files** and contains compiled CSS.
   0.1.8 shipped raw `.scss` plus tests and *no* CSS, so the
   `lib/datePicker.css` the README documented 404'd for two years.
   `npm run check:package` enforces this — it inspects the real
   `npm pack` output for required files, forbidden patterns (tests, snapshots,
   `.npmrc`, `.env`) and a non-empty stylesheet. It runs in CI and in
   `prepublishOnly`. Add a rule there whenever a new file type starts shipping.

## Traps

Things that look wrong but are correct, and things that look fine but aren't.

**The `@hig/*` packages are vendored on purpose.** `src/TextField.jsx`,
`src/icons.jsx` and `src/styles/_hig-text-field.scss` are reimplementations of
`@hig/text-field` and `@hig/icon`. Do not "restore" the dependency: it is
deprecated and peer-locked to `react ^15.4.1 || ^16.3.2`, and its official
successor `@hig/input` caps at `react ^17` on end-of-life `emotion@10`. Both
fail `ERESOLVE` for React 18/19 consumers. Class names are kept identical to
upstream so consumer style overrides keep working — renaming them is breaking.

**React 18 is the floor because of `useId`.** Widening the peer range to 16/17
requires replacing `useId`, and a counter-based id reintroduces the SSR
hydration mismatches `useId` exists to prevent. React 17 also has no `exports`
map, so `react/jsx-runtime` is unresolvable there under Node ESM.

**Sass: configure `variables` before `datepicker`.** In
`src/styles/datePicker.scss`, `@use ".../variables" with (...)` must precede
`@use ".../datepicker"`. Values containing commas need parentheses —
`$datepicker__font-family: (ArtifaktElement, sans-serif)` — otherwise the comma
reads as an argument separator and the font stack silently loses its fallback,
rendering the calendar in the browser's default serif.

**react-datepicker's props are a three-way union.** They are discriminated by
`selectsRange` / `selectsMultiple`, and `onChange` receives a `Date`, a tuple or
an array depending on the variant. All three discriminants are optional, so an
object without them matches every variant and TypeScript reports against the
last one. `SingleDateProps` picks the single-date member with `Extract`, and the
JSX site passes both discriminants explicitly as `false` to pin it. Removing
either is why `onChange` will suddenly appear to take `Date[]`.

**Some react-datepicker props are typed `true | never`.**
`showMonthYearDropdown` and `withPortal` model "off" as the *absence* of the
prop, so passing `false` is a type error. Omit them.

**Declarations are generated, never hand-written.** `tsconfig.build.json` emits
them into `types/`, and the build copies that tree into both `lib/` and `es/`.
Do not add a checked-in `index.d.ts` - that is what drifted before.

**react-datepicker's CSS often outranks yours.** It uses selectors like
`.react-datepicker__day:not([aria-disabled="true"]):hover` (specificity 0,3,0),
which beats a plain `.react-datepicker__day:hover`. Match the specificity rather
than reaching for `!important`.

**`placeholder` must be passed to `ReactDatePicker` as `placeholderText`.** It
injects `placeholder={this.props.placeholderText}` into the cloned input, which
overwrites anything set directly.

**`es/package.json` and `lib/package.json` are generated by the build** and
mark module type. Without them Node parses `es/index.js` as CommonJS and throws
on the first `export`. Never add a top-level `"type"` field to the root
`package.json` — it would mislabel the CJS build.

**axe's colour-contrast rule is disabled in the jsdom tests** because jsdom has
no canvas to sample. Contrast is only genuinely measured by `npm run test:e2e`
in real Chromium. A green unit run is not evidence that contrast is fine.

## Keeping it secure and current

- `npm run audit` (runtime deps) must report 0. CI enforces this on every push;
  dev-dependency findings are worth fixing but do not reach consumers.
- Dependabot (`.github/dependabot.yml`) runs weekly over npm and GitHub Actions.
  Runtime deps get individual PRs; dev tooling is grouped to cut noise. React
  majors are deliberately ignored — widening the supported range is a decision,
  not a bot PR. Read the grouped dev PRs rather than merging on green: a major
  bump can quietly change test semantics.
- CI also installs the packed tarball against each supported React major. That
  job is what catches "the peer range is a lie" — trust it over reasoning.
- When bumping `react-datepicker`, re-read its changelog for prop renames and
  DOM/class changes, then run `npm run test:e2e` and *look at the screenshots*.
  The v1→v9 jump silently changed the nav button markup, the day-cell corner
  radius and the keyboard-cursor colour; none of it failed a unit test.
- Prefer removing a dependency over updating it. A consumer install is currently
  13 packages; keep it that way.
- Check that test tooling actually type-checks its own matchers. `vitest-axe`
  silently stopped augmenting Vitest's types at v3 and its assertions became
  `any`; the unit tests now call `axe-core` directly instead.
- Verify visual claims with a real browser before saying the UX is unchanged.
  Four regressions in this repo's history were invisible to the test suite.

## Releasing

```sh
# on master, clean tree
npm ci && npm run lint && npm run typecheck && npm test && npm run test:e2e
npm run build && npm run audit
npm version <major|minor|patch>   # updates package.json + tags
git push && git push --tags
gh release create v<x.y.z> --notes-file <changelog section>
npm publish                        # prepublishOnly re-runs lint + test + build
```

Then install the *published* package from the registry into a scratch project
and exercise ESM import, CJS require and SSR. Publishing succeeding is not the
same as the package working.

Update `CHANGELOG.md` in the same commit as the version bump. Breaking changes
need a migration note in `README.md`.
