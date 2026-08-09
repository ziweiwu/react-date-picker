import { useState } from "react";
import { createRoot } from "react-dom/client";
import DatePicker from "../../src/index";
import "../../src/styles/datePicker.scss";

/**
 * Single-picker page used only by `scripts/demo-gif.mjs` to record the
 * animated README demo. It is deliberately a fixed-size white frame: the
 * recorded video is the viewport, so the layout here *is* the GIF's crop.
 *
 * `scripts/demo-gif.mjs` pins the browser clock to the same month the
 * interaction script clicks in, so the recording never drifts with the
 * calendar.
 */
function Demo() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <main
      style={{
        fontFamily: "system-ui, sans-serif",
        width: 420,
        height: 440,
        padding: "28px 32px",
        boxSizing: "border-box",
        background: "#fff",
      }}
    >
      <DatePicker
        id="demo-picker"
        instruction="Click the field, or press Enter and use the arrow keys"
        label="Departure date"
        onChange={setDate}
        selected={date}
        showClearButton
        showInstruction
      />
    </main>
  );
}

const container = document.querySelector("#demo");
if (!container) throw new Error("#demo container missing");

createRoot(container).render(<Demo />);
