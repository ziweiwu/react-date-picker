import type { SVGProps } from "react";

/**
 * Icons vendored from @hig/icons so the package no longer depends on the
 * deprecated @hig/icon wrapper, which rendered SVG markup through
 * `dangerouslySetInnerHTML` and injected a global `.st0` CSS class.
 *
 * Both icons are decorative: the accessible name lives on the control that
 * owns them, so they are hidden from assistive technology.
 */
export type IconProps = SVGProps<SVGSVGElement>;

export function CalendarIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="hig__icon hig__icon--calendar"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M15,10.1h-1V12H9v-1.9H8V12H4.2v1H8v3H4.2v1H8v2h1v-2h5v2h1v-2h4v-1h-4v-3h4v-1h-4V10.1z M14,16H9v-3h5V16z"
      />
      <path
        fill="currentColor"
        d="M20,4h-2V3c0-0.6-0.4-1-1-1h-1c-0.6,0-1,0.4-1,1v1H8V3c0-0.6-0.4-1-1-1H6C5.4,2,5,2.4,5,3v1H3 C2.4,4,2,4.4,2,5v16c0,0.6,0.4,1,1,1h17c0.6,0,1-0.4,1-1V5C21,4.4,20.6,4,20,4z M16,3h1v3h-1V3z M6,3h1v3H6V3z M20,21H3V9h17V21z M20,8H3V5h2v1c0,0.6,0.4,1,1,1h1c0.6,0,1-0.4,1-1V5h7v1c0,0.6,0.4,1,1,1h1c0.6,0,1-0.4,1-1V5h2V8z"
      />
    </svg>
  );
}

export function ClearIcon(props: IconProps) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="hig__icon hig__icon--clear"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12 22a10 10 0 1 1 10-10 10 10 0 0 1-10 10zm0-19a9 9 0 1 0 9 9 9 9 0 0 0-9-9z"
      />
      <path
        fill="currentColor"
        d="M15.45 7.47l-3.48 3.48-3.46-3.48-1.06 1.06 3.46 3.48-3.46 3.46 1.06 1.06 3.46-3.46 3.45 3.46 1.06-1.06-3.45-3.46 3.48-3.48-1.06-1.06z"
      />
    </svg>
  );
}
