# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## 1.0.0

First release that installs on modern React. 0.1.x could not be used with
React 17+ at all, because its `@hig/*` dependencies were peer-locked to React
15/16.

### Breaking

- **Dates are native `Date` objects.** `onChange` now receives a `Date` (or
  `null`), not a moment. Values passed *in* still accept moment/dayjs objects,
  date strings and timestamps.
- **Date format strings are [date-fns](https://date-fns.org/docs/format)
  patterns**, not moment patterns — `YYYY` becomes `yyyy`, `DD` becomes `dd`.
  `locale` takes a date-fns locale object rather than a string.
- **The stylesheet must be imported explicitly:**
  `import "react-hig-datepicker/styles.css"`. 0.1.x loaded `@hig/text-field`'s
  CSS as a side effect of importing the component.
- **`propTypes` removed.** React 19 ignores them at runtime; bundled
  TypeScript declarations replace them.
- Minimum React version is 16.9. Minimum Node version for development is 18.

### Fixed

- The input was rendered permanently `disabled`, which made the picker
  unreachable by keyboard and hidden from assistive technology. It is now a
  focusable, read-only combobox.
- Because of that same `disabled` state, HIG's `--disabled` rule set
  `display: none` on the clear button, so `showClearButton` could never
  display anything. It now works.
- Every instance hardcoded `id="hig__date-picker"`, producing duplicate DOM ids
  and label associations that pointed at the wrong element. Ids are now unique
  per instance and `<label for>` resolves correctly.
- The published tarball shipped raw `.scss` and test files in `lib/` and `es/`
  but no compiled CSS, so the `lib/datePicker.css` import the README documented
  did not exist. All three CSS paths now resolve.
- The stylesheet contained unscoped `input { … !important }` and `button { … }`
  rules that restyled unrelated elements in the host application.
- A stray `calender` prop and several presentational props leaked onto the DOM.
- The ESM build is now marked as such, so `import` no longer loads it as
  CommonJS and fail on its first `export`.

### Accessibility

- Visible `:focus-visible` indicators on the input, clear button and month
  navigation. 0.1.x set `outline: 0` (WCAG 2.4.7).
- Colours darkened to meet WCAG AA contrast; hue preserved. Muted text was
  2.85:1, day hover was 1.87:1, both now pass. Tokens are in
  `src/styles/_tokens.scss`.
- Instructions and error text are linked to the input with `aria-describedby`.
- Decorative icons are `aria-hidden`; the clear button has an accessible name.
- Added a `forced-colors` (high-contrast) treatment and
  `prefers-reduced-motion` handling for the label transition.
- Verified by axe in jsdom on every unit run and in real Chromium — including
  colour contrast — on every e2e run.

### Changed

- Built with Vite instead of the unmaintained nwb; tested with Vitest and
  Testing Library instead of enzyme, which has no React 18/19 adapter.
- `@hig/text-field`, `@hig/icon` and `@hig/styles` (all deprecated) are no
  longer dependencies. Their markup and styles are vendored, so the
  `hig__text-field-v1*` class names consumer overrides rely on are unchanged.
- moment is no longer a dependency; react-datepicker 9 uses date-fns.
- Runtime dependencies report zero known vulnerabilities.
- The field is 3px taller: the floated label's line box is 18px, but 0.1.x
  reserved only 15px for it, so the label overhung the input.

## 0.1.8 and earlier

See the git history.
