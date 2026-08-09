import { useState } from "react";
import { createRoot } from "react-dom/client";
import DatePicker from "../../src/index";
import "../../src/styles/datePicker.scss";

/**
 * Deterministic page used only to generate the README screenshots.
 *
 * Every date is fixed, and `scripts/screenshots.mjs` freezes the browser clock
 * as well, so re-running the capture produces byte-identical images instead of
 * drifting with the current month.
 */

const SELECTED = new Date(2026, 7, 20); // 20 August 2026

/** A labelled capture target. `data-shot` is the crop selector. */
function Shot({
  name,
  width = 320,
  children,
}: {
  name: string;
  width?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      data-shot={name}
      style={{
        background: "#fff",
        padding: "20px 24px 24px",
        width,
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

function Screenshots() {
  const [withValue, setWithValue] = useState<Date | null>(SELECTED);
  const [empty, setEmpty] = useState<Date | null>(null);

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexWrap: "wrap",
        gap: 32,
        alignItems: "flex-start",
        padding: 24,
        background: "#fff",
      }}
    >
      <Shot name="default">
        <DatePicker
          label="Select a date"
          onChange={setEmpty}
          selected={empty}
        />
      </Shot>

      <Shot name="filled">
        <DatePicker
          label="Departure date"
          onChange={setWithValue}
          selected={withValue}
          showClearButton
        />
      </Shot>

      <Shot name="instruction">
        <DatePicker
          instruction="Bookings open 30 days ahead"
          label="Arrival date"
          onChange={setWithValue}
          selected={withValue}
          showInstruction
        />
      </Shot>

      <Shot name="disabled">
        <DatePicker disabled label="Unavailable" selected={SELECTED} />
      </Shot>

      <Shot name="no-icon">
        <DatePicker
          label="Without icon"
          onChange={setWithValue}
          selected={withValue}
          showIcon={false}
        />
      </Shot>

      {/* Roomy container so the open calendar is never clipped. */}
      <div
        data-shot="calendar"
        style={{
          background: "#fff",
          padding: "20px 24px 24px",
          width: 340,
          height: 400,
          boxSizing: "border-box",
        }}
      >
        <DatePicker
          id="calendar-shot"
          label="Select a date"
          onChange={setWithValue}
          selected={withValue}
        />
      </div>
    </main>
  );
}

const container = document.querySelector("#shots");
if (!container) throw new Error("#shots container missing");

createRoot(container).render(<Screenshots />);
