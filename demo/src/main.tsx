import { useState } from "react";
import { createRoot } from "react-dom/client";
import DatePicker from "../../src/index";
import "../../src/styles/datePicker.scss";

function Demo() {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [invalid, setInvalid] = useState<Date | null>(null);

  return (
    <main style={{ fontFamily: "sans-serif", margin: "2rem", maxWidth: 640 }}>
      <h1>react-hig-datepicker</h1>

      <section>
        <h2>Default</h2>
        <DatePicker
          instruction="Choose a date"
          label="Select a date"
          onChange={setStartDate}
          selected={startDate}
          showClearButton
          showInstruction
        />
        <p>
          Selected: <code>{startDate ? startDate.toISOString() : "null"}</code>
        </p>
      </section>

      <section>
        <h2>Disabled</h2>
        <DatePicker disabled label="Unavailable" selected={startDate} />
      </section>

      {/*
        Rendered here so the Playwright suite exercises the error state in a
        real browser. jsdom cannot measure colour contrast, so an error state
        that only ever appeared in the unit tests was never contrast-checked.
      */}
      <section>
        <h2>With a validation error</h2>
        <DatePicker
          errors="Choose a date in the future"
          instruction="Bookings open 30 days ahead"
          label="Return date"
          onChange={setInvalid}
          selected={invalid}
          showInstruction
        />
      </section>

      <section>
        <h2>With a minimum date of today</h2>
        <DatePicker
          label="Future dates only"
          minDate={new Date()}
          onChange={setRangeStart}
          selected={rangeStart}
        />
      </section>
    </main>
  );
}

const container = document.querySelector("#demo");
if (!container) throw new Error("#demo container missing from demo/index.html");

createRoot(container).render(<Demo />);
