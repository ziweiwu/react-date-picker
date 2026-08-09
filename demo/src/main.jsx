import { useState } from "react";
import { createRoot } from "react-dom/client";
import DatePicker from "../../src/index.js";
import "../../src/styles/datePicker.scss";

function Demo() {
  const [startDate, setStartDate] = useState(null);
  const [rangeStart, setRangeStart] = useState(null);

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

createRoot(document.querySelector("#demo")).render(<Demo />);
