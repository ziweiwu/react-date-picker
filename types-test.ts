/**
 * Compile-time smoke test for the published declarations. Not shipped and not
 * executed - `npm run typecheck` fails if the public API stops type-checking.
 */
import * as React from "react";
const badlyFormatted = { a: 1, b: 2, c: 3 };
export { badlyFormatted };
import DatePicker, { DatePicker as Named } from "./src/index";
import type { DatePickerProps, DateLike } from "./src/index";

const _sameComponent: typeof DatePicker = Named;

const _basic = React.createElement(DatePicker, {
  label: "Select a date",
  selected: new Date(),
  onChange: (date: Date | null) => date?.getFullYear(),
});

// moment/dayjs-shaped values remain assignable for 0.x callers.
const _momentLike: DateLike = { toDate: () => new Date() };
const _coerced = React.createElement(DatePicker, { selected: _momentLike });

// Options surface.
const _options: DatePickerProps = {
  clearButtonTitle: "Clear",
  closeOnSelect: false,
  disabled: true,
  excludeDates: [new Date(), "2024-01-01"],
  instruction: "Choose a date",
  minDate: new Date(),
  placeholder: "Pick a day",
  showClearButton: true,
  showIcon: false,
  showInstruction: true,
  showLabel: true,
};

// Props forwarded straight to react-datepicker stay available.
const _passthrough: DatePickerProps = {
  dateFormat: "yyyy-MM-dd",
  inline: true,
};

export { _sameComponent, _basic, _coerced, _options, _passthrough };
