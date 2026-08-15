# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## Unreleased

Four rounds of adversarial UX and QA review against the running demo. Test
count went from 35 unit / 9 browser to 40 unit / 28 browser.

### Added

- **`errors`** renders a validation message, marks the input `aria-invalid` and
  adds the message to the input's accessible description. `TextField` had
  rendered all of this since it was vendored, but `errors` is not a
  react-datepicker prop so it never reached the field through `...rest` - the
  styling was unreachable dead code.

### Fixed

- **The calendar could render off the top of the screen.** The comment on
  `popperModifiers` claimed the configuration disabled flipping. It never did:
  react-datepicker always prepends its own `flip`, and its `popperProps`
  escape hatch is typed to forbid replacing the middleware. On a 1280x350
  viewport the calendar landed at `y = -133`, putting the month header and both
  navigation buttons out of reach. A `size` middleware now caps the calendar to
  the space actually available, which keeps it on screen and usually lets it
  stay below the field after all.
- **Keyboard focus could scroll out of sight.** Capping the height makes the
  calendar a scroll container, and react-datepicker focuses day cells with
  `preventScroll: true`. Arrow-key navigation now scrolls the focused day back
  into view.
- **Opening the calendar could widen the page.** Between 261px and 272px the
  calendar hung over the right edge, because `size` measured from the viewport
  edge while `shift` had already moved the calendar 15px in. Opening the
  calendar now adds no horizontal overflow at any width.
- **A critical `aria-required-children` violation on most months.** `fixedHeight`
  pads a short month to six week rows; hiding that row's cells one at a time
  left an empty `role="row"` behind. It affected 28 of the 36 months in
  2025-2027, and the axe test only ever saw whichever month CI ran in. Such a
  row is now hidden whole, and a test pins the clock to a month that has one.
- **Month navigation was a 15x15 target**, meeting WCAG 2.5.8 only through the
  spacing exception. It is now 25x25, with the caret glyph unmoved.
- **The instruction text was restyled as an error** whenever `errors` was set,
  so the hint and the error message looked identical. Only the error carries
  the error treatment now, and a focused field in error keeps a visible 2px
  underline instead of losing it to declaration order.

### Changed

- `INVARIANTS.md` corrected where it described behaviour the code did not have:
  Escape keeps focus on the field (react-datepicker stopped blurring it), and
  the calendar's placement below the field is a preference rather than a
  guarantee. Upstream deviations that will not be fixed - the arrow-key gate on
  the input, and month navigation being outside the Tab sequence - are now
  recorded as such.

## 1.2.0

Adds `INVARIANTS.md`, a behavioural specification of what the component is
expected to do, with each statement tagged by where it is enforced. Auditing
the implementation against it turned up six violations, all fixed here. Test
count went from 23 unit / 7 browser to 35 unit / 9 browser.

### Fixed

- **`excludeDates` silently discarded moment and dayjs values.** The guard that
  recognises react-datepicker's annotated `{ date, message }` form tested
  `"date" in value`, and both libraries expose a `date()` *method*. Matching
  entries were then read as annotations, produced an `Invalid Date`, and were
  dropped - so days the caller meant to block stayed selectable. Silent, and it
  loosened a restriction.
- **Clicking the calendar icon did nothing.** Vendoring the HIG text field
  replaced its `<label htmlFor>` wrapper with a `<span>`, so the click no longer
  reached the input. Restored; the icon opens the calendar again.
- **Focus was stranded after clearing.** The clear button unmounts with the
  value it clears, dropping focus to `<body>`. Focus now returns to the input.
- **An `Invalid Date` passed straight through.** `toDate` validated only the
  string and number paths, so `selected={new Date("nonsense")}` reached
  react-datepicker instead of rendering an empty field. All paths are validated
  now.
- **`showLabel={false}` removed the accessible name.** It is meant to hide the
  label visually, not strip the input's name; the text is now applied as
  `aria-label`.
- **The forwarded ref was a mount-time snapshot** taken through
  `useImperativeHandle` with a cast that hid a possible `null`. The caller's ref
  is forwarded directly, so it always tracks the live instance.

### Documentation

- The README hero is now an animated recording of the picker in use
  (`docs/images/demo.gif`), re-recordable with `npm run demo:gif`. Like the
  stills, it pins the browser clock so the recording does not drift with the
  real calendar. Requires ffmpeg.

### Changed

- Clearing now leaves the calendar open, because focus returns to the field and
  react-datepicker opens on focus. An earlier draft of the spec asserted the
  opposite; keeping focus is the accessibility requirement, so the spec was
  corrected to match. See INVARIANTS.md 4.4 and 4.5.

## 1.1.1

**Never published to npm.** The publish was blocked by a two-factor prompt, and
these changes shipped as part of 1.2.0 instead. The registry goes 1.1.0 ->
1.2.0.

Documentation only. No code changes - the published JavaScript, CSS and type
declarations are byte-identical to 1.1.0.

- The README now shows what the component looks like: a hero screenshot of the
  open calendar plus a gallery covering the empty, filled, keyboard-focused,
  helper-text, disabled and hover states. Images are referenced by absolute URL
  so they render on npm as well as GitHub.
- `npm run screenshots` regenerates those images. It freezes the browser clock
  and fixes every date on the capture page, so re-running it produces identical
  output instead of drifting with the current month.
- Added a Sponsor button to the repository (`.github/FUNDING.yml`) and badges
  for npm, CI, licence and sponsorship to the README.

## 1.1.0

Rewritten in TypeScript. No runtime behaviour changed; every test from 1.0.0
passes unmodified.

### Added

- Type declarations are now **generated from the source** rather than
  hand-maintained, so they cannot drift from the implementation. Declaration
  maps ship too, so "go to definition" lands on the real `.tsx`.
- `TextFieldProps` and `DateLikeWithMessage` are exported alongside the
  existing `DatePickerProps` and `DateLike`.
- `excludeDates` now accepts react-datepicker's annotated
  `{ date, message }` form as well as plain dates.

### Changed

- Range and multi-date selection are explicitly unsupported in the types.
  react-datepicker models its props as a three-way union whose `onChange`
  differs per variant; this wrapper pins the single-date variant, so
  `selectsRange` / `selectsMultiple` are now compile errors rather than
  silently changing what `onChange` receives.
- `showMonthYearDropdown` and `withPortal` are no longer passed as `false`.
  react-datepicker types them as `true | never`, so "off" is the absence of
  the prop. Behaviour is unchanged - both already defaulted to off.
- Dropped `vitest-axe`, which augments a legacy Vitest global namespace that
  Vitest 4 no longer uses, so its matcher never type-checked. The unit tests
  call `axe-core` directly and assert on violation ids, which also makes
  failures name the offending rule.

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
- **Minimum React version is 18.** react-datepicker 9 itself supports 16.9+,
  but this component uses `useId` for the unique-id fix above, which React 17
  does not have. The alternative - a counter-based id - reintroduces the SSR
  hydration mismatches that `useId` exists to prevent, so raising the floor was
  preferred over shipping a shim. React 17 also has no `exports` map, so
  `react/jsx-runtime` is unresolvable there under Node ESM. Minimum Node
  version for development is 18.

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
