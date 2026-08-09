import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import ReactDatePicker from "react-datepicker";
import { offset, shift } from "@floating-ui/react";
import TextField from "./TextField.jsx";
import { CalendarIcon } from "./icons.jsx";

/**
 * Normalise a date-like value to a native `Date`.
 *
 * react-datepicker 9 works with native dates rather than moment, but callers
 * upgrading from 0.x still pass moment (or dayjs) instances, so anything
 * exposing `toDate()` is accepted and converted.
 */
function toDate(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toDateArray(value) {
  if (!Array.isArray(value)) return value;
  return value.map((entry) =>
    entry && typeof entry === "object" && "date" in entry
      ? { ...entry, date: toDate(entry.date) }
      : toDate(entry),
  );
}

/**
 * Keep the calendar pinned below the field and nudge it back into the
 * viewport when it would overflow, without ever flipping above the input.
 * This reproduces the popper.js configuration used before react-datepicker 9
 * moved to floating-ui.
 */
const POPPER_MODIFIERS = [offset(0), shift()];

const DatePicker = forwardRef(function DatePicker(
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
  const instanceRef = useRef(null);
  const fallbackId = useId();
  const inputId = id ?? fallbackId;

  // Expose the underlying react-datepicker instance, as the 0.x release did.
  useImperativeHandle(ref, () => instanceRef.current, []);

  const handleClear = useCallback(
    (event) => {
      if (onChange) onChange(null, event);
    },
    [onChange],
  );

  const customInput = useMemo(
    () => (
      <TextField
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
      endDate={toDate(endDate)}
      excludeDates={toDateArray(excludeDates)}
      fixedHeight={fixedHeight}
      highlightDates={toDateArray(highlightDates)}
      id={inputId}
      includeDates={toDateArray(includeDates)}
      isClearable={false}
      maxDate={toDate(maxDate)}
      minDate={toDate(minDate)}
      onChange={onChange}
      placeholderText={placeholder}
      popperModifiers={POPPER_MODIFIERS}
      popperPlacement="bottom-start"
      // `readOnly` is deliberately NOT forwarded to react-datepicker: since
      // v9 it also suppresses opening the calendar. The input is marked
      // read-only inside TextField instead, so typing stays disabled while
      // the field remains focusable and the calendar still opens.
      ref={instanceRef}
      selected={toDate(selected)}
      shouldCloseOnSelect={closeOnSelect}
      showMonthDropdown={false}
      showMonthYearDropdown={false}
      showTimeSelect={false}
      showYearDropdown={false}
      startDate={toDate(startDate)}
      withPortal={false}
    />
  );
});

export default DatePicker;
