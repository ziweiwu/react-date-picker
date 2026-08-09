import {
  forwardRef,
  useCallback,
  useId,
  useMemo,
  type SyntheticEvent,
} from "react";
import ReactDatePicker, {
  type DatePickerProps as ReactDatePickerProps,
} from "react-datepicker";
import { offset, shift } from "@floating-ui/react";
import TextField from "./TextField.js";
import { CalendarIcon } from "./icons.js";

/**
 * Anything that can be normalised to a native `Date`.
 *
 * Native dates pass through untouched; moment and dayjs instances are accepted
 * for backwards compatibility with 0.x and converted via `toDate()`.
 */
export type DateLike = Date | { toDate(): Date } | string | number;

/** An excluded date, optionally with the reason shown in a tooltip. */
export interface DateLikeWithMessage {
  date: DateLike;
  message?: string;
}

function hasToDate(value: object): value is { toDate(): Date } {
  return typeof (value as { toDate?: unknown }).toDate === "function";
}

/**
 * Distinguish react-datepicker's annotated `{ date, message }` form from a
 * date-like object.
 *
 * A bare `"date" in value` test is not enough: moment and dayjs instances both
 * expose a `date()` accessor, so they matched it and were then read as
 * annotations, producing `new Date(fn)` - an Invalid Date - and silently
 * vanishing from `excludeDates`. An annotation has a `date` *value* and no
 * `toDate()` method.
 */
function isDateLikeWithMessage(value: unknown): value is DateLikeWithMessage {
  if (typeof value !== "object" || value === null) return false;
  if (value instanceof Date) return false;

  const candidate = value as { date?: unknown; toDate?: unknown };
  if (typeof candidate.toDate === "function") return false;

  return "date" in candidate && typeof candidate.date !== "function";
}

/**
 * `Array.isArray` widens a `readonly T[]` to `any[]`, which erases the element
 * type. This guard keeps it.
 */
function isArray<T>(value: readonly T[] | undefined): value is readonly T[] {
  return Array.isArray(value);
}

/**
 * Normalise a date-like value to a native `Date`.
 *
 * react-datepicker 9 works with native dates rather than moment, but callers
 * upgrading from 0.x still pass moment (or dayjs) instances, so anything
 * exposing `toDate()` is accepted and converted.
 */
export function toDate(value: DateLike): Date | null;
export function toDate(value: DateLike | null | undefined): Date | null | undefined;
export function toDate(
  value: DateLike | null | undefined,
): Date | null | undefined {
  if (value === null || value === undefined) return value;

  const parsed =
    value instanceof Date
      ? value
      : typeof value === "object" && hasToDate(value)
        ? value.toDate()
        : new Date(value);

  // Validate every path, not just the string/number one. A caller-supplied
  // `new Date("nonsense")`, or a moment whose `toDate()` is invalid, must be
  // rejected rather than reaching react-datepicker as an Invalid Date.
  return parsed instanceof Date && !Number.isNaN(parsed.getTime())
    ? parsed
    : null;
}

/** Coerce a list of date-likes, dropping anything unparseable. */
function toDates(value: readonly DateLike[] | undefined): Date[] | undefined {
  if (!isArray(value)) return undefined;
  return value.flatMap((entry) => {
    const date = toDate(entry);
    return date ? [date] : [];
  });
}

/**
 * react-datepicker types `excludeDates` as `Date[] | { date, message }[]` -
 * a union of arrays, not an array of unions - so a mixed input is normalised
 * to the annotated form when any entry carries a message.
 */
function toExcludeDates(
  value: readonly (DateLike | DateLikeWithMessage)[] | undefined,
): Date[] | { date: Date; message?: string }[] | undefined {
  if (!isArray(value)) return undefined;

  if (!value.some(isDateLikeWithMessage)) {
    return toDates(value as readonly DateLike[]);
  }

  return value.flatMap((entry) => {
    if (isDateLikeWithMessage(entry)) {
      const date = toDate(entry.date);
      return date ? [{ date, ...(entry.message ? { message: entry.message } : {}) }] : [];
    }
    const date = toDate(entry);
    return date ? [{ date }] : [];
  });
}

/**
 * Keep the calendar pinned below the field and nudge it back into the
 * viewport when it would overflow, without ever flipping above the input.
 * This reproduces the popper.js configuration used before react-datepicker 9
 * moved to floating-ui.
 */
const POPPER_MODIFIERS = [offset(0), shift()];

/**
 * react-datepicker's props are a three-way union discriminated by
 * `selectsRange` / `selectsMultiple`, and each variant types `onChange`
 * differently (a Date, a tuple, or an array). All three discriminants are
 * optional, so an object without them matches every variant and TypeScript
 * reports against the last. This wrapper is single-date only, so the
 * single-date variant is selected explicitly.
 */
type SingleDateProps = Extract<
  ReactDatePickerProps,
  { selectsRange?: false | undefined; selectsMultiple?: false | undefined }
>;

type PassthroughProps = Omit<
  SingleDateProps,
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
  // Range and multi-select change the shape of `onChange`. This wrapper is
  // single-date only, so both are excluded rather than partially supported.
  | "selectsRange"
  | "selectsMultiple"
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
  excludeDates?: readonly (DateLike | DateLikeWithMessage)[];
  fixedHeight?: boolean;
  /** Controlled override for the field's focused styling. */
  focused?: boolean;
  highlightDates?: readonly DateLike[];
  /** Applied to the `<input>`; a stable id is generated when omitted. */
  id?: string;
  includeDates?: readonly DateLike[];
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
  onChange?: (date: Date | null, event?: SyntheticEvent) => void;
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
const DatePicker = forwardRef<ReactDatePicker, DatePickerProps>(
  function DatePicker(
    {
      clearButtonTitle = "Clear date",
      closeOnSelect = true,
      disabled = false,
      endDate,
      excludeDates,
      fixedHeight = true,
      focused,
      highlightDates,
      id,
      includeDates,
      instruction,
      label,
      maxDate,
      minDate,
      onChange,
      placeholder,
      selected,
      showClearButton = false,
      showIcon = true,
      showInstruction = false,
      showLabel = true,
      startDate,
      ...rest
    },
    ref,
  ) {
    const fallbackId = useId();
    const inputId = id ?? fallbackId;

    const handleClear = useCallback(
      (event: SyntheticEvent) => {
        onChange?.(null, event);
      },
      [onChange],
    );

    const customInput = useMemo(
      () => (
        <TextField
          // `showLabel` controls presentation only. When the text is hidden the
          // name has to survive for assistive technology.
          aria-label={!showLabel && label ? label : undefined}
          clearButtonTitle={clearButtonTitle}
          focused={focused}
          icon={showIcon ? <CalendarIcon /> : undefined}
          instructions={showInstruction ? instruction : undefined}
          label={showLabel ? label : undefined}
          onClearButtonClick={handleClear}
          showClearButton={showClearButton}
        />
      ),
      [
        clearButtonTitle,
        focused,
        handleClear,
        instruction,
        label,
        showClearButton,
        showIcon,
        showInstruction,
        showLabel,
      ],
    );

    return (
      <ReactDatePicker
        {...rest}
        customInput={customInput}
        disabled={disabled}
        endDate={toDate(endDate) ?? undefined}
        excludeDates={toExcludeDates(excludeDates)}
        fixedHeight={fixedHeight}
        highlightDates={toDates(highlightDates)}
        id={inputId}
        includeDates={toDates(includeDates)}
        isClearable={false}
        maxDate={toDate(maxDate) ?? undefined}
        minDate={toDate(minDate) ?? undefined}
        onChange={onChange}
        placeholderText={placeholder}
        popperModifiers={POPPER_MODIFIERS}
        popperPlacement="bottom-start"
        // Passing both discriminants explicitly pins react-datepicker's props
        // to its single-date variant. Without them the object matches all
        // three variants and `onChange` resolves to the multi-select shape.
        selectsMultiple={false}
        selectsRange={false}
        // `readOnly` is deliberately NOT forwarded to react-datepicker: since
        // v9 it also suppresses opening the calendar. The input is marked
        // read-only inside TextField instead, so typing stays disabled while
        // the field remains focusable and the calendar still opens.
        ref={ref}
        selected={toDate(selected)}
        shouldCloseOnSelect={closeOnSelect}
        // `showMonthYearDropdown` and `withPortal` are omitted rather than set
        // to false: react-datepicker models them as `true | never`, so the
        // "off" state is the absence of the prop. Both already default to off.
        showMonthDropdown={false}
        showTimeSelect={false}
        showYearDropdown={false}
        startDate={toDate(startDate) ?? undefined}
      />
    );
  },
);

export default DatePicker;
