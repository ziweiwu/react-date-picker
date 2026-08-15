import {
  forwardRef,
  useCallback,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type InputHTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from "react";
import clsx from "clsx";
import { ClearIcon } from "./icons.js";

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "required" | "value"
>;

export interface TextFieldProps extends NativeInputProps {
  /** Accessible name and tooltip for the clear button. */
  clearButtonTitle?: string;
  /** Validation message. Also switches the field to its error styling. */
  errors?: ReactNode;
  /** Controlled override for the focused styling. */
  focused?: boolean;
  hideInstructionsOnErrors?: boolean;
  /** Decorative leading icon. */
  icon?: ReactNode;
  /** Helper text rendered below the field. */
  instructions?: ReactNode;
  /** Floating label text. */
  label?: ReactNode;
  onClearButtonClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /**
   * Marks the input required. A string is also rendered as the required
   * notice below the field, matching the original HIG behaviour.
   */
  required?: boolean | string;
  showClearButton?: boolean;
  value?: string;
}

/**
 * A vendored, accessibility-corrected reimplementation of
 * `TextFieldPresenter` from @hig/text-field.
 *
 * The upstream package was deprecated with a `react@^16.3.2` peer range, and
 * its replacement (@hig/input) caps at react@^17 on top of an end-of-life
 * emotion 10. Either one makes this package uninstallable for React 18/19
 * consumers, so the markup and class names are reproduced here instead. The
 * DOM structure and `hig__text-field-v1*` class names are kept identical so
 * existing consumer style overrides continue to apply.
 *
 * react-datepicker clones this element and injects `ref`, `value`, `id`,
 * `readOnly`, `disabled`, `placeholder` and the event handlers, so the ref is
 * forwarded all the way to the `<input>` that react-datepicker focuses.
 */
const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      clearButtonTitle = "Clear date",
      disabled = false,
      errors,
      focused,
      hideInstructionsOnErrors = false,
      icon,
      id,
      instructions,
      label,
      onBlur,
      onClearButtonClick,
      onFocus,
      // react-datepicker injects its own `readOnly`; the field is always a
      // calendar trigger, so the injected value is ignored on purpose.
      readOnly: _ignoredReadOnly,
      required,
      showClearButton = false,
      type = "text",
      value,
      "aria-describedby": ariaDescribedBy,
      // Destructured so the explicit `aria-invalid` below cannot silently
      // erase a caller-supplied one when the field has no errors of its own.
      "aria-invalid": ariaInvalid,
      ...inputProps
    },
    ref,
  ) {
    const [selfFocused, setSelfFocused] = useState(false);
    const fallbackId = useId();
    const inputId = id ?? fallbackId;

    // react-datepicker owns the forwarded ref (it focuses the input through
    // it), so keep a local handle alongside rather than replacing it.
    const inputRef = useRef<HTMLInputElement | null>(null);
    const attachInput = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    const handleClear = useCallback(
      (event: MouseEvent<HTMLButtonElement>) => {
        onClearButtonClick?.(event);
        // The button unmounts with the value it clears, so focus would
        // otherwise fall through to <body> and strand keyboard users.
        inputRef.current?.focus();
      },
      [onClearButtonClick],
    );

    // `focused` is an optional controlled override, matching the original API.
    const isFocused = focused !== undefined ? focused : selfFocused;

    const hasValue = typeof value === "string" && value.length > 0;
    const showsClearButton = showClearButton && hasValue && !disabled;
    const showsInstructions = instructions
      ? !(errors && hideInstructionsOnErrors)
      : false;
    // Only a string is meaningful as notice text; `required` also arrives as a
    // boolean from react-datepicker, which must not render an empty paragraph.
    const requiredNotice = typeof required === "string" ? required : undefined;

    const handleFocus = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        setSelfFocused(true);
        onFocus?.(event);
      },
      [onFocus],
    );

    const handleBlur = useCallback(
      (event: FocusEvent<HTMLInputElement>) => {
        setSelfFocused(false);
        onBlur?.(event);
      },
      [onBlur],
    );

    const instructionsId = `${inputId}-instructions`;
    const errorsId = `${inputId}-errors`;
    const describedBy =
      clsx(
        ariaDescribedBy,
        showsInstructions && instructionsId,
        errors && errorsId,
      ) || undefined;

    return (
      <div
        className={clsx("hig__text-field-v1", {
          "hig__text-field-v1--button": type === "button",
          "hig__text-field-v1--required": required,
          "hig__text-field-v1--disabled": disabled,
          "hig__text-field-v1--clear-button-visible": showsClearButton,
          "hig__text-field-v1--with-errors": errors,
        })}
      >
        <div
          className={clsx("hig__text-field-v1__content", {
            "hig__text-field-v1__content--with-icon": icon,
          })}
        >
          <div
            className={clsx("hig__text-field-v1__input-wrapper", {
              "hig__text-field-v1__input-wrapper--focused": isFocused,
              "hig__text-field-v1__input-wrapper--with-errors": errors,
              "hig__text-field-v1__input-wrapper--disabled": disabled,
            })}
          >
            {label && <span className="hig__text-field-v1__label-spacer" />}
            {label && (
              <label
                htmlFor={inputId}
                className={clsx("hig__text-field-v1__label", {
                  "hig__text-field-v1__label--input-focused": isFocused,
                  "hig__text-field-v1__label--required": required,
                  "hig__text-field-v1__label--with-value": hasValue,
                })}
              >
                {label}
              </label>
            )}
            <div className="hig__text-field-v1__input-row">
              {icon && (
                // A <label>, not a <span>: clicking the icon must focus the
                // input and open the calendar, as it did before this component
                // was vendored. The SVG is aria-hidden, so this label
                // contributes no text and the accessible name is unchanged.
                <label
                  className={clsx("hig__text-field-v1__icon", {
                    "hig__text-field-v1__icon--disabled": disabled,
                  })}
                  htmlFor={inputId}
                >
                  {icon}
                </label>
              )}
              <input
                {...inputProps}
                aria-describedby={describedBy}
                aria-invalid={errors ? true : ariaInvalid}
                className={clsx(
                  "hig__text-field-v1__input",
                  inputProps.className,
                  { "hig__text-field-v1__input--no-value": !hasValue },
                )}
                disabled={disabled}
                id={inputId}
                onBlur={handleBlur}
                onFocus={handleFocus}
                readOnly
                ref={attachInput}
                required={required ? true : undefined}
                type={type}
                value={value ?? ""}
              />
              {showsClearButton && (
                <span className="hig__text-field-v1__clear">
                  <button
                    className="hig__icon-button hig__icon-button--transparent"
                    onClick={handleClear}
                    title={clearButtonTitle}
                    type="button"
                  >
                    <span className="hig__icon-button__icon">
                      <ClearIcon />
                    </span>
                    <span className="hig__sr-only">{clearButtonTitle}</span>
                  </button>
                </span>
              )}
            </div>
          </div>
          {showsInstructions && (
            <p className="hig__text-field-v1__instructions" id={instructionsId}>
              {instructions}
            </p>
          )}
          {errors && (
            <p className="hig__text-field-v1__errors" id={errorsId}>
              {errors}
            </p>
          )}
          {requiredNotice && (
            <p className="hig__text-field-v1__required-notice">
              {requiredNotice}
            </p>
          )}
        </div>
      </div>
    );
  },
);

export default TextField;
