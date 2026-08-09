# react-hig-datepicker

An accessible React date picker styled with the Autodesk HIG design language.

- Built on [react-datepicker](https://github.com/Hacker0x01/react-datepicker) 9
- Works with React 16.9 → 19, in both ESM and CommonJS, and renders on the server
- No runtime dependency on the deprecated `@hig/*` packages
- Zero known vulnerabilities in runtime dependencies

## Install

```sh
npm install react-hig-datepicker
```

React and React DOM are peer dependencies:

```sh
npm install react react-dom
```

## Usage

```jsx
import { useState } from "react";
import DatePicker from "react-hig-datepicker";
import "react-hig-datepicker/styles.css";

export default function Example() {
  const [date, setDate] = useState(null);

  return (
    <DatePicker
      label="Select a date"
      onChange={setDate}
      selected={date}
      showClearButton
    />
  );
}
```

The stylesheet is a separate import so the package stays safe to load in
server and Node environments. `react-hig-datepicker/lib/datePicker.css` and
`react-hig-datepicker/css/datePicker.css` resolve to the same file.

### Styling from Sass

The Sass sources ship with the package, so you can override HIG tokens before
the stylesheet is generated:

```scss
@use "react-hig-datepicker/src/styles/datePicker";
```

## Props

Every [react-datepicker prop](https://reactdatepicker.com) is forwarded, with
the exceptions noted under *Reserved* below. The additions are:

| Prop               | Type                    | Default        | Description                                                    |
| ------------------ | ----------------------- | -------------- | -------------------------------------------------------------- |
| `label`            | `string`                | —              | Floating label text.                                            |
| `showLabel`        | `boolean`               | `true`         | Render the label.                                               |
| `instruction`      | `string`                | —              | Helper text below the field, linked via `aria-describedby`.     |
| `showInstruction`  | `boolean`               | `false`        | Render the helper text.                                         |
| `placeholder`      | `string`                | —              | Input placeholder.                                              |
| `showIcon`         | `boolean`               | `true`         | Show the HIG calendar icon.                                     |
| `showClearButton`  | `boolean`               | `false`        | Show a clear button once a date is selected.                    |
| `clearButtonTitle` | `string`                | `"Clear date"` | Accessible name and tooltip for the clear button.               |
| `closeOnSelect`    | `boolean`               | `true`         | Close the calendar after a day is picked.                       |
| `focused`          | `boolean`               | —              | Controlled override for the field's focused styling.            |
| `disabled`         | `boolean`               | `false`        | Disable the field.                                              |
| `selected`         | `Date \| null`          | —              | The selected date.                                              |
| `onChange`         | `(date, event) => void` | —              | Called with a `Date`, or `null` when cleared.                   |
| `id`               | `string`                | auto           | Input id. A unique one is generated when omitted.               |

`selected`, `minDate`, `maxDate`, `startDate`, `endDate`, `excludeDates`,
`includeDates` and `highlightDates` all accept a `Date`, a date string, a
timestamp, or any object with a `toDate()` method (moment, dayjs).

**Reserved.** `customInput`, `isClearable`, `popperModifiers`,
`popperPlacement` and `withPortal` are controlled by this component to keep the
HIG presentation intact.

TypeScript declarations are bundled; no `@types` package is needed.

## Accessibility

The component is verified against WCAG 2.1 AA on every run, with axe in jsdom
(unit tests) and in a real browser (`npm run test:e2e`, which also checks
colour contrast).

- The field is a focusable, read-only combobox — typing is disabled, but it is
  reachable by <kbd>Tab</kbd> and opens with <kbd>Enter</kbd>/<kbd>↓</kbd>.
- Labels and helper text are programmatically associated with the input, and
  each instance gets a unique id.
- All interactive elements have a visible `:focus-visible` indicator.
- The palette meets AA contrast minimums, and the calendar has a
  `forced-colors` (high-contrast) treatment.
- The label transition is disabled under `prefers-reduced-motion`.

## Development

```sh
npm install
npm start          # demo at http://localhost:5173
npm test           # unit tests (Vitest + Testing Library)
npm run test:e2e   # browser tests (Playwright + axe)
npm run lint
npm run typecheck  # checks the published .d.ts
npm run build      # -> es/, lib/, css/
```

## Upgrading from 0.1.x

0.1.x could not be installed alongside React 17+ — its `@hig/*` dependencies
were peer-locked to React 15/16 — so 1.0 replaces that chain. Migration is
usually two changes.

### 1. Dates are native `Date` objects, not moment

react-datepicker 9 dropped moment. `onChange` now hands you a `Date`:

```diff
-onChange={(date) => setDate(date)}          // date was a moment
-<span>{date.format("YYYY-MM-DD")}</span>
+onChange={(date) => setDate(date)}          // date is a Date, or null
+<span>{date?.toISOString().slice(0, 10)}</span>
```

Values you *pass in* still accept moment objects, so `selected={moment()}`
keeps working — only values you receive changed.

Date format strings are now [date-fns](https://date-fns.org/docs/format)
patterns rather than moment ones. Most notably `YYYY` becomes `yyyy` and `DD`
becomes `dd`. `locale` now takes a date-fns locale object rather than a string.

### 2. Import the stylesheet explicitly

0.1.x pulled in `@hig/text-field`'s CSS as a side effect of importing the
component, and the `lib/datePicker.css` the old README pointed at was never
actually published. All styles now live in one file that you import yourself:

```js
import "react-hig-datepicker/styles.css";
```

### Also worth knowing

- **Fixed:** the input was previously rendered permanently `disabled`, which
  made it unreachable by keyboard and — via HIG's `--disabled` rule — meant
  `showClearButton` could never display anything. Both now work.
- **Fixed:** every instance used the hardcoded id `hig__date-picker`, so
  multiple pickers on a page produced duplicate ids and broken label
  associations. Ids are now unique per instance.
- **Fixed:** the stylesheet contained unscoped `input { … !important }` and
  `button { … }` rules that restyled unrelated elements in the host page.
- **Changed:** several colours were darkened to reach AA contrast. The blues
  and teal keep their hue; only luminance moved. Tokens live in
  `src/styles/_tokens.scss`.
- **Removed:** `propTypes`. React 19 ignores them at runtime; TypeScript
  declarations replace them.

## License

[MIT](./LICENSE) © Ziwei Wu
