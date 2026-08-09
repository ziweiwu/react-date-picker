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

**3.2** <kbd>Escape</kbd> closes the calendar. **[unit]**

> Known deviation: react-datepicker's Escape handler also *blurs* the input.
> The ARIA combobox pattern expects focus to stay on the field. This is
> upstream behaviour, not something this wrapper introduces, and working around
> it would mean fighting react-datepicker's key handling. Recorded here so it
> is a known gap rather than a surprise.

**3.3** The calendar opens below the field, left-aligned with it, and never
flips above — it shifts to stay in the viewport instead. **[e2e]**

**3.4** Picking a day calls `onChange` with that day and, when `closeOnSelect`
is set (the default), closes the calendar. **[unit]**

**3.5** Arrow keys move between days and <kbd>Enter</kbd> selects. **[e2e]**

**3.6** Month/year dropdowns and the time picker are never shown; this is a
day picker. **[unit]**

**3.7** Days outside the displayed month are hidden, and day cells are square
in every state. **[e2e]**

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
