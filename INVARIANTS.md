# Behavioural invariants

What `<DatePicker />` is expected to do, written as statements that can be
tested rather than prose. Each is tagged with where it is enforced.

- **[unit]** `src/DatePicker.test.tsx` (Vitest + Testing Library, jsdom)
- **[e2e]** `e2e/datepicker.spec.ts` (Playwright, real Chromium)
- **[type]** the compiler, via `src/index.d.ts` consumers
- **[none]** stated but not yet covered — treat as a gap, not a guarantee

`AGENTS.md` covers repo and packaging rules. This file is only about how the
component behaves.

---

## 1. Value handling

**1.1** `selected` accepts a native `Date`, an ISO string, an epoch number, or
any object with a `toDate()` method (moment, dayjs), and renders the
corresponding day. **[unit]**

**1.2** An unparseable `selected` renders an empty field rather than throwing
or displaying `Invalid Date`. **[unit]**

**1.3** The same coercion applies to every date-valued prop: `minDate`,
`maxDate`, `startDate`, `endDate`, `excludeDates`, `includeDates`,
`highlightDates`. A value accepted by `selected` is accepted by all of
them. **[unit]**

> `excludeDates` additionally accepts react-datepicker's annotated
> `{ date, message }` form. Distinguishing that from a moment instance is
> subtle — see bug 1 in the audit below.

**1.4** `onChange` receives a native `Date`, never a moment, and `null` when
the value is cleared. **[unit]**

**1.5** The component is fully controlled. It never renders a date the caller
did not pass in `selected`. **[unit]**

**1.6** Coercion never mutates the caller's object. **[none]**

## 2. The field

**2.1** The input is `readOnly`: typing does not change the value. Dates are
chosen through the calendar only. **[e2e]**

**2.2** The input is **not** `disabled` unless the caller passes `disabled`.
It is reachable with <kbd>Tab</kbd> and exposed to assistive
technology. **[unit] [e2e]**

**2.3** When `disabled`, the input is disabled, the calendar does not open, and
the clear button is not rendered. **[unit]**

**2.4** Every instance has a unique input `id` unless the caller supplies one,
and the `<label>` resolves to that input. **[unit]**

**2.5** Clicking the calendar icon opens the calendar, exactly as clicking the
input does. The icon is a click target, not decoration. **[unit]**

**2.6** The floating label rises when the field has a value or focus, and rests
on the input line otherwise. **[e2e]**

## 3. The calendar

**3.1** Clicking the input opens the calendar; so does focusing it with the
keyboard. **[unit] [e2e]**

**3.2** <kbd>Escape</kbd> closes the calendar and leaves focus on the field, as
the ARIA combobox pattern expects. **[unit] [e2e]**

> This used to be recorded here as a known deviation: react-datepicker's
> Escape handler also *blurred* the input. As of react-datepicker 9.1.0 it no
> longer does, verified in real Chromium. The e2e test pins the better
> behaviour so an upgrade that reintroduces the blur fails rather than quietly
> restoring the deviation.

**3.3** The calendar is placed below the field and left-aligned with it
whenever there is room. It is always fully inside the viewport vertically, and
opening it never adds horizontal page scroll at any width — including widths
too narrow for the field itself, where the page already scrolls sideways
without it. **[e2e]**

> Below-and-left-aligned is a preference, not a guarantee. react-datepicker
> composes its floating-ui middleware as
> `[flip({padding: 15}), offset(10), arrow(...), ...popperModifiers]`, so its
> own `flip` always runs before anything this wrapper supplies, and its
> `popperProps` escape hatch is typed `Omit<UseFloatingOptions, "middleware">`
> so the array cannot be replaced either. When the calendar genuinely does not
> fit below, it flips above. What *is* guaranteed is that it stays on screen:
> a `size` middleware caps the calendar to the space available at whichever
> placement flip settles on. Before that cap existed, a 1280x350 viewport put
> the calendar at `y = -133`, with the month header and both navigation
> buttons above the top edge — unreachable, and impossible to scroll to.
>
> Horizontally the partner is `shift`, and the two have to agree about the
> same thing. `size` derives `availableWidth` from the boundary width minus
> its own padding and knows nothing about where `shift` placed the calendar,
> so a symmetric inset is wrong either way: 15px on both sides shrank a
> calendar that already fitted, and 0 on both sides ignored the 15px `shift`
> had already committed to on the left, leaving a 3px overflow across
> 261–272px. Reserving the padding on one side alone gives exactly the right
> budget. The calendar is also `box-sizing: border-box`, or its 1px border
> would sit outside the cap and put 2px of that overflow straight back.
>
> Below 320px the *field* still overflows on its own — its vendored
> `min-width: 230px` does not fit a 240–260px viewport even with the calendar
> shut. That width is part of the HIG text-field contract this package
> reproduces, so it is left alone; 320px, the width WCAG 1.4.10 is written
> against, is clean.

**3.3.1** Capping the calendar's height makes it a scroll container, so the
focused day is scrolled back into view as the keyboard cursor moves. **[e2e]**

> react-datepicker focuses day cells with `.focus({ preventScroll: true })`,
> which switches off the browser's own scroll-into-view. That is invisible
> until something clips the calendar; once 3.3's cap does, arrow-key
> navigation walked the cursor straight out of the visible area. A `focusin`
> listener in `DatePicker.tsx` restores it, and only acts while the calendar
> is actually overflowing.

**3.4** Picking a day calls `onChange` with that day and, when `closeOnSelect`
is set (the default), closes the calendar. **[unit]**

**3.5** Arrow keys move between days and <kbd>Enter</kbd> selects. **[e2e]**

> Known deviation, upstream: while focus is still on the *input*,
> react-datepicker only handles <kbd>ArrowUp</kbd>/<kbd>ArrowDown</kbd> — they
> are what move focus into the day grid. <kbd>ArrowLeft</kbd>,
> <kbd>ArrowRight</kbd>, <kbd>PageUp</kbd> and <kbd>PageDown</kbd> pressed
> first are silently dropped, with no visible or announced response, and only
> start working once the grid has focus. `AGENTS.md` already notes this for
> `scripts/demo-gif.mjs`; it is user-facing too. Closing it would mean fighting
> react-datepicker's key handling, exactly as with 3.2's original deviation, so
> the only lever this component actually owns is `instruction` copy.

**3.6** The month navigation buttons are not in the <kbd>Tab</kbd> sequence.
Reaching a different month by keyboard is done with the arrow keys, rolling
over the month boundary. **[none]**

> This is react-datepicker's single-tab-stop grid, and it matches the ARIA
> Authoring Practices date-picker pattern, so WCAG 2.1.1 is satisfied — every
> function is keyboard-reachable. Recorded because a sighted keyboard user
> looking straight at the chevrons has no way to discover that. Listed as a
> deliberate deviation rather than a bug so it does not get "fixed" into a
> fight with upstream.

**3.7** Month/year dropdowns and the time picker are never shown; this is a
day picker. **[unit]**

**3.8** Days outside the displayed month are hidden, and day cells are square
in every state. A week row made up entirely of such days is hidden as a row,
not merely cell by cell. **[e2e]**

> `fixedHeight` pads a five-row month out to six so the calendar's height never
> changes. Hiding only the cells left that padding row in the accessibility
> tree as a `role="row"` with no cells in it — a critical
> `aria-required-children` violation, on 28 of the 36 months in 2025–2027.
> Whether CI caught it depended entirely on which month it ran in. The row is
> hidden with `visibility: hidden`, so it still reserves its height.

## 4. The clear button

**4.1** Rendered only when `showClearButton` is set **and** the field has a
value **and** the field is not disabled. **[unit]**

**4.2** Activating it calls `onChange(null, event)`. **[unit]**

**4.3** It is a real `<button type="button">` with an accessible name, reachable
by keyboard. **[unit]**

**4.4** Because the button unmounts once the value is gone, focus moves to the
input rather than falling back to `<body>`. **[unit]**

**4.5** As a consequence of 4.4 the calendar opens, exactly as it does whenever
the field receives focus. An earlier draft of this document asserted the
opposite — that clearing must leave the calendar shut — but the two cannot both
hold: react-datepicker opens on focus, and keeping focus is the accessibility
requirement. Retaining focus wins; the open calendar is the honest
consequence. **[unit]**

## 5. Labelling and accessibility

**5.1** No axe violations, open or closed, against WCAG 2.1 A and
AA. **[unit] [e2e]**

**5.2** The input always has an accessible name when `label` is supplied —
including when `showLabel` is `false`, which should hide the label visually
without removing the name. **[unit]**

**5.3** `instruction` is linked to the input with `aria-describedby` when
`showInstruction` is set. **[unit]**

**5.4** Every interactive element has a visible `:focus-visible`
indicator. **[e2e]**

**5.5** Decorative icons are `aria-hidden` and not focusable. **[unit]**

**5.6** Colour is never the sole carrier of meaning, and all text meets WCAG AA
contrast. **[e2e]**

**5.7** Every pointer target is at least 24x24 CSS px, meeting WCAG 2.2 AA
2.5.8 outright rather than through the spacing exception. **[e2e]**

> Day cells and the clear button are 30x30. The month navigation was 15x15,
> which passed only because nothing sits within 24px of it; it now carries
> 5px of padding around an unchanged 15px caret glyph. All colour values live
> in `src/styles/_tokens.scss` with their measured ratio in a comment — that
> is what keeps 5.6 checkable, so no colour may be written anywhere else.

**5.8** `errors` renders a validation message, marks the input `aria-invalid`,
and adds the message to the input's accessible description alongside any
`instruction`. **[unit]**

> `TextField` had rendered all of this since it was vendored, but no caller
> could reach it: `errors` is not a react-datepicker prop, so it never arrived
> through `...rest`. The styling in `_hig-text-field.scss` was dead code.
>
> Only the error message carries the error colour and weight. Upstream applied
> them to `instruction` as well, so a field with both rendered the hint and the
> error identically, with nothing marking out the one to act on. The error is
> still *identified* to assistive technology by `aria-invalid`, which is what
> SC 3.3.1 leans on, so no English "Error:" prefix is prepended to
> caller-supplied text.
>
> A field that is focused *and* in error keeps a 2px underline in the error
> colour. Both modifiers are single classes, so previously whichever rule came
> last in the file won and focusing an errored field dropped the underline back
> to 1px.
>
> The demo renders an error fixture purely so the Playwright suite exercises
> this state in a real browser: jsdom cannot sample pixels, so `$hig-error` had
> never actually been contrast-checked anywhere.
>
> The string form of `required`, which renders a notice line, stays
> unreachable. react-datepicker's `cloneElement` overwrites `required` on the
> custom input with its own prop, typed `boolean`, so a string cannot be
> routed through without lying to the compiler. `TextField` still accepts one,
> for parity with the `@hig/text-field` API it reproduces.

## 6. Integration

**6.1** Any react-datepicker prop not listed as reserved is forwarded
unchanged. **[type]**

**6.2** Reserved props — `customInput`, `isClearable`, `popperModifiers`,
`popperPlacement`, `readOnly`, `withPortal`, `selectsRange`, `selectsMultiple` —
are controlled by this component and rejected by the compiler. **[type]**

**6.3** No internal prop reaches the DOM. **[unit]**

**6.4** The forwarded `ref` resolves to the live react-datepicker instance for
as long as it is mounted. **[unit]**

**6.5** The entry point is side-effect free: importing it renders nothing and
touches no browser API, so it is safe under SSR. **[unit]**

---

## Audit — 2026-08-09

Checking the implementation against the above turned up six violations.
Each is listed with its trigger, why it happens, and the minimal fix.

### Bug 1 — `excludeDates` silently discards moment and dayjs values

Violates **1.3**.

*Trigger:* `excludeDates={[moment("2026-01-01")]}` (or dayjs).

*Cause:* `isDateLikeWithMessage` tests `"date" in value` to spot the annotated
`{ date, message }` form. Both moment and dayjs expose a `date()` **method**,
so the guard matches them. The annotated branch then reads `entry.date` — a
function — and `new Date(fn)` is `Invalid Date`, so the entry is dropped. Every
excluded date disappears and the calendar allows days the caller meant to
block. Worst kind of failure: silent, and it loosens a restriction.

*Fix:* require a genuine annotation object — a `date` property that is not a
function, and no `toDate` method.

### Bug 2 — clicking the calendar icon does nothing

Violates **2.5**.

*Trigger:* click the calendar icon to the left of the field.

*Cause:* 0.x wrapped the icon in `<label htmlFor={id}>`, so a click moved focus
to the input and react-datepicker opened on focus. Vendoring the component
replaced that with a plain `<span>`, so the click lands on nothing. A regression
introduced by this project, not inherited.

*Fix:* restore the `<label htmlFor>` wrapper. The SVG is `aria-hidden`, so the
extra label contributes no text and the accessible name is unchanged.

### Bug 3 — focus is stranded after clearing

Violates **4.4**.

*Trigger:* focus the clear button with the keyboard, press <kbd>Enter</kbd>.

*Cause:* clearing empties the value, `showsClearButton` becomes false and the
button unmounts. Focus falls back to `<body>`, so a keyboard user loses their
position in the page.

*Fix:* move focus to the input as part of clearing. This makes the calendar
open, since react-datepicker opens on focus — see invariant 4.5, which was
rewritten to match rather than asserting a behaviour the fix contradicts.

### Bug 4 — an `Invalid Date` is passed through instead of rejected

Violates **1.2**.

*Trigger:* `selected={new Date("nonsense")}`, or a moment whose `toDate()`
returns an invalid date.

*Cause:* `toDate` returns early for `instanceof Date` and for `toDate()`
results without checking `getTime()`. Only the string/number path validates, so
validity depends on which input form was used.

*Fix:* validate once, on the way out.

### Bug 5 — the forwarded ref is a mount-time snapshot

Violates **6.4**.

*Trigger:* remount the inner picker, e.g. by changing its `key`.

*Cause:* `useImperativeHandle(..., [])` captures `instanceRef.current` once, and
the cast to `ReactDatePicker` hides that it can be `null`. The internal ref is
not read anywhere else, so the indirection buys nothing.

*Fix:* forward the caller's ref straight to `<ReactDatePicker>`.

### Bug 6 — `showLabel={false}` removes the accessible name

Violates **5.2**.

*Trigger:* `<DatePicker label="Departure date" showLabel={false} />`.

*Cause:* the visible `<label>` is the only naming source, so hiding it leaves
the input nameless to assistive technology. `showLabel` is meant to control
visual presentation, not remove semantics.

*Fix:* when the label is hidden but text was supplied, apply it as `aria-label`.
