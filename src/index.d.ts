import * as React from "react";
import type { DatePickerProps as ReactDatePickerProps } from "react-datepicker";

/**
 * Anything that can be normalised to a native `Date`.
 *
 * Native dates pass through untouched; moment and dayjs instances are accepted
 * for backwards compatibility with 0.x and converted via `toDate()`.
 */
export type DateLike = Date | { toDate(): Date } | string | number;

type PassthroughProps = Omit<
  ReactDatePickerProps,
  | "customInput"
  | "endDate"
  | "excludeDates"
  | "highlightDates"
  | "includeDates"
  | "isClearable"
  | "maxDate"
  | "minDate"
  | "onChange"
  | "placeholderText"
  | "popperModifiers"
  | "popperPlacement"
  | "readOnly"
  | "selected"
  | "selectsRange"
  | "shouldCloseOnSelect"
  | "startDate"
  | "withPortal"
>;

export interface DatePickerProps extends PassthroughProps {
  /** Accessible name and tooltip for the clear button. */
  clearButtonTitle?: string;
  /** Close the calendar once a day is picked. Defaults to `true`. */
  closeOnSelect?: boolean;
  disabled?: boolean;
  endDate?: DateLike | null;
  excludeDates?: DateLike[];
  fixedHeight?: boolean;
  /** Controlled override for the field's focused styling. */
  focused?: boolean;
  highlightDates?: DateLike[];
  /** Applied to the `<input>`; a stable id is generated when omitted. */
  id?: string;
  includeDates?: DateLike[];
  /** Helper text rendered below the field when `showInstruction` is set. */
  instruction?: string;
  /** Floating label text, rendered when `showLabel` is set. */
  label?: string;
  maxDate?: DateLike | null;
  minDate?: DateLike | null;
  /**
   * Called with the newly selected date, or `null` when the field is cleared.
   *
   * Breaking change in 1.0: this receives a native `Date`, not a moment.
   */
  onChange?: (
    date: Date | null,
    event?: React.SyntheticEvent<unknown> | undefined,
  ) => void;
  placeholder?: string;
  selected?: DateLike | null;
  showClearButton?: boolean;
  showIcon?: boolean;
  showInstruction?: boolean;
  showLabel?: boolean;
  startDate?: DateLike | null;
}

/**
 * A date picker styled with the Autodesk HIG design language.
 *
 * The ref resolves to the underlying react-datepicker instance.
 */
declare const DatePicker: React.ForwardRefExoticComponent<
  DatePickerProps & React.RefAttributes<unknown>
>;

export { DatePicker };
export default DatePicker;
