import { createRef, useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import DatePicker from "./index.js";
import type ReactDatePickerInstance from "react-datepicker";
import type { DateLike } from "./index.js";

const SEPT_15 = new Date(2017, 8, 15);

function getInput() {
  return screen.getByRole("textbox");
}

/**
 * Run axe and return violation ids, so a failure names the rule instead of
 * dumping the whole result object.
 *
 * axe's colour-contrast rule needs a real canvas to sample rendered pixels,
 * which jsdom does not provide, so it is disabled here. Contrast is checked
 * for real in the Playwright suite.
 */
async function axeViolations(container: HTMLElement): Promise<string[]> {
  const { violations } = await axe.run(container, {
    rules: { "color-contrast": { enabled: false } },
  });
  return violations.map((v) => `${v.id}: ${v.help}`);
}

/**
 * Stand-in for a moment/dayjs instance.
 *
 * Both libraries expose a `date()` accessor alongside `toDate()`, and that
 * combination is what previously confused the `excludeDates` annotation
 * guard, so the mock must carry both.
 */
function momentLike(date: Date): DateLike {
  return {
    toDate: () => date,
    date: () => date.getDate(),
    format: () => date.toISOString(),
  } as unknown as DateLike;
}

describe("DatePicker", () => {
  it("renders the selected date in the field", () => {
    render(<DatePicker selected={SEPT_15} />);
    expect(getInput()).toHaveValue("09/15/2017");
  });

  it("accepts a moment-like value for backwards compatibility with 0.x", () => {
    render(<DatePicker selected={momentLike(SEPT_15)} />);
    expect(getInput()).toHaveValue("09/15/2017");
  });

  it("ignores an unparseable value instead of throwing", () => {
    render(<DatePicker selected="not-a-date" />);
    expect(getInput()).toHaveValue("");
  });

  describe("labelling", () => {
    it("associates the floating label with the input", () => {
      render(<DatePicker label="Select a date" selected={SEPT_15} />);
      expect(screen.getByLabelText("Select a date")).toBe(getInput());
    });

    it("gives each instance a unique input id", () => {
      // Regression: 0.x hardcoded id="hig__date-picker" on every instance, so
      // two pickers on one page produced duplicate ids and every <label
      // htmlFor> pointed at the wrong element.
      render(
        <>
          <DatePicker label="First" />
          <DatePicker label="Second" />
        </>,
      );
      const inputs = screen.getAllByRole("textbox");
      expect(inputs).toHaveLength(2);
      const [first, second] = inputs as [HTMLElement, HTMLElement];
      expect(first.id).toBeTruthy();
      expect(second.id).toBeTruthy();
      expect(first.id).not.toBe(second.id);
      expect(screen.getByLabelText("First")).toBe(first);
      expect(screen.getByLabelText("Second")).toBe(second);
    });

    it("honours a caller-supplied id", () => {
      render(<DatePicker id="departure" label="Departure" />);
      expect(getInput()).toHaveAttribute("id", "departure");
    });

    it("links instructions to the input via aria-describedby", () => {
      render(
        <DatePicker instruction="Choose a date" label="Date" showInstruction />,
      );
      expect(getInput()).toHaveAccessibleDescription("Choose a date");
    });
  });

  describe("errors", () => {
    // `TextField` always rendered these, but no caller could reach them:
    // `errors` is not a react-datepicker prop, so it never arrived via
    // `...rest`. Now that DatePicker declares it, keep the wiring covered.
    it("renders the message and marks the input invalid", () => {
      render(<DatePicker errors="Pick a weekday" label="Date" />);

      expect(screen.getByText("Pick a weekday")).toBeInTheDocument();
      expect(getInput()).toHaveAttribute("aria-invalid", "true");
    });

    it("describes the input with the message", () => {
      render(<DatePicker errors="Pick a weekday" label="Date" />);
      expect(getInput()).toHaveAccessibleDescription("Pick a weekday");
    });

    it("describes the input with both the instruction and the message", () => {
      render(
        <DatePicker
          errors="Pick a weekday"
          instruction="Choose a date"
          label="Date"
          showInstruction
        />,
      );
      expect(getInput()).toHaveAccessibleDescription(
        "Choose a date Pick a weekday",
      );
    });

    it("leaves the input valid when there is no message", () => {
      render(<DatePicker label="Date" />);
      expect(getInput()).not.toHaveAttribute("aria-invalid");
    });

    it("has no axe violations while showing an error", async () => {
      const { container } = render(
        <DatePicker errors="Pick a weekday" label="Date" selected={SEPT_15} />,
      );
      expect(await axeViolations(container)).toEqual([]);
    });
  });

  describe("keyboard accessibility", () => {
    it("exposes a focusable, read-only input rather than a disabled one", async () => {
      // Regression: 0.x always passed `disabled` to the text field, which made
      // the control unreachable by keyboard and hid it from assistive tech.
      render(<DatePicker label="Date" />);
      const input = getInput();

      expect(input).toHaveAttribute("readonly");
      expect(input).not.toBeDisabled();

      await userEvent.tab();
      expect(input).toHaveFocus();
    });

    it("opens the calendar from the keyboard", async () => {
      render(<DatePicker label="Date" selected={SEPT_15} />);

      await userEvent.tab();
      expect(getInput()).toHaveFocus();

      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });

    it("closes the calendar on Escape", async () => {
      render(<DatePicker label="Date" selected={SEPT_15} />);

      await userEvent.click(getInput());
      expect(await screen.findByRole("dialog")).toBeInTheDocument();

      await userEvent.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("selection", () => {
    it("opens on click and reports the picked day as a Date", async () => {
      const onChange = vi.fn();
      render(
        <DatePicker label="Date" onChange={onChange} selected={SEPT_15} />,
      );

      await userEvent.click(getInput());
      const dialog = await screen.findByRole("dialog");

      await userEvent.click(
        within(dialog).getByRole("gridcell", { name: /September 20th, 2017/i }),
      );

      expect(onChange).toHaveBeenCalledTimes(1);
      const firstCall = onChange.mock.calls[0];
      expect(firstCall).toBeDefined();
      const [picked] = firstCall as [Date | null];
      expect(picked).toBeInstanceOf(Date);
      // Narrow for the assertions below; toBeInstanceOf already proved it.
      if (!(picked instanceof Date)) throw new Error("expected a Date");
      expect(picked.getFullYear()).toBe(2017);
      expect(picked.getMonth()).toBe(8);
      expect(picked.getDate()).toBe(20);
    });

    it("closes after selection when closeOnSelect is set", async () => {
      function Controlled() {
        const [date, setDate] = useState<Date | null>(SEPT_15);
        return <DatePicker label="Date" onChange={setDate} selected={date} />;
      }
      render(<Controlled />);

      await userEvent.click(getInput());
      const dialog = await screen.findByRole("dialog");
      await userEvent.click(
        within(dialog).getByRole("gridcell", { name: /September 20th, 2017/i }),
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(getInput()).toHaveValue("09/20/2017");
    });
  });

  describe("clear button", () => {
    it("is hidden until there is a value", () => {
      render(<DatePicker label="Date" showClearButton />);
      expect(
        screen.queryByRole("button", { name: /clear date/i }),
      ).not.toBeInTheDocument();
    });

    it("clears the value and reports null", async () => {
      // Regression: in 0.x the field was always rendered disabled, and HIG's
      // `--disabled` rule set `display: none` on the clear button, so
      // showClearButton could never actually show anything.
      const onChange = vi.fn();
      render(
        <DatePicker
          label="Date"
          onChange={onChange}
          selected={SEPT_15}
          showClearButton
        />,
      );

      const clear = screen.getByRole("button", { name: /clear date/i });
      expect(clear).toBeVisible();

      await userEvent.click(clear);
      expect(onChange).toHaveBeenCalledWith(null, expect.anything());
    });

    it("is not rendered while disabled", () => {
      render(
        <DatePicker disabled label="Date" selected={SEPT_15} showClearButton />,
      );
      expect(
        screen.queryByRole("button", { name: /clear date/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("disabled", () => {
    it("disables the input and does not open the calendar", async () => {
      render(<DatePicker disabled label="Date" selected={SEPT_15} />);
      const input = getInput();

      expect(input).toBeDisabled();

      await userEvent.click(input);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("options", () => {
    it("hides the calendar icon when showIcon is false", () => {
      const { container } = render(
        <DatePicker label="Date" showIcon={false} />,
      );
      expect(container.querySelector(".hig__icon--calendar")).toBeNull();
    });

    it("renders the calendar icon by default and hides it from screen readers", () => {
      const { container } = render(<DatePicker label="Date" />);
      const icon = container.querySelector(".hig__icon--calendar");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveAttribute("aria-hidden", "true");
    });

    it("passes the placeholder through to the input", () => {
      render(<DatePicker label="Date" placeholder="Pick a day" />);
      expect(getInput()).toHaveAttribute("placeholder", "Pick a day");
    });

    it("does not leak internal props onto the DOM", () => {
      // Regression: 0.x forwarded a stray `calender` prop plus its own
      // presentational props to react-datepicker, which passed them to the DOM.
      render(
        <DatePicker
          instruction="text"
          label="Date"
          showInstruction
          showLabel
        />,
      );
      const input = getInput();
      for (const attr of [
        "calender",
        "showlabel",
        "showinstruction",
        "instruction",
      ]) {
        expect(input).not.toHaveAttribute(attr);
      }
    });
  });

  // Each case below maps to a numbered invariant in INVARIANTS.md.
  describe("invariants", () => {
    it("1.3 excludes moment-like dates instead of silently ignoring them", async () => {
      // A moment/dayjs instance has a `date()` method, which the annotation
      // guard used to mistake for the `{ date, message }` form, dropping every
      // entry and leaving supposedly-blocked days selectable.
      render(
        <DatePicker
          excludeDates={[momentLike(new Date(2017, 8, 20))]}
          label="Date"
          selected={SEPT_15}
        />,
      );

      await userEvent.click(getInput());
      const dialog = await screen.findByRole("dialog");
      const excluded = within(dialog).getByRole("gridcell", {
        name: /September 20th, 2017/i,
      });
      expect(excluded).toHaveAttribute("aria-disabled", "true");
    });

    it("1.3 still honours the annotated { date, message } form", async () => {
      render(
        <DatePicker
          excludeDates={[{ date: new Date(2017, 8, 20), message: "Closed" }]}
          label="Date"
          selected={SEPT_15}
        />,
      );

      await userEvent.click(getInput());
      const dialog = await screen.findByRole("dialog");
      expect(
        within(dialog).getByRole("gridcell", { name: /September 20th, 2017/i }),
      ).toHaveAttribute("aria-disabled", "true");
    });

    it("1.2 renders an empty field for an Invalid Date object", () => {
      render(<DatePicker label="Date" selected={new Date("nonsense")} />);
      expect(getInput()).toHaveValue("");
    });

    it("1.2 renders an empty field when toDate() yields an invalid date", () => {
      render(<DatePicker label="Date" selected={momentLike(new Date(NaN))} />);
      expect(getInput()).toHaveValue("");
    });

    it("2.5 opens the calendar when the calendar icon is clicked", async () => {
      const { container } = render(
        <DatePicker label="Date" selected={SEPT_15} />,
      );
      const icon = container.querySelector(".hig__text-field-v1__icon");
      expect(icon).toBeInTheDocument();

      await userEvent.click(icon as Element);
      expect(await screen.findByRole("dialog")).toBeInTheDocument();
    });

    it("4.5 moves focus to the input after clearing", async () => {
      function Controlled() {
        const [date, setDate] = useState<Date | null>(SEPT_15);
        return (
          <DatePicker
            label="Date"
            onChange={setDate}
            selected={date}
            showClearButton
          />
        );
      }
      render(<Controlled />);

      const clear = screen.getByRole("button", { name: /clear date/i });
      clear.focus();
      await userEvent.click(clear);

      // The button unmounts with the value, so focus must be handed back to
      // the input rather than falling through to <body>.
      expect(getInput()).toHaveFocus();
      expect(document.body).not.toHaveFocus();
    });

    it("4.5 opens the calendar after clearing, as a consequence of refocusing", async () => {
      function Controlled() {
        const [date, setDate] = useState<Date | null>(SEPT_15);
        return (
          <DatePicker
            label="Date"
            onChange={setDate}
            selected={date}
            showClearButton
          />
        );
      }
      render(<Controlled />);

      await userEvent.click(
        screen.getByRole("button", { name: /clear date/i }),
      );

      expect(getInput()).toHaveValue("");
      expect(getInput()).toHaveFocus();
      // Documented in INVARIANTS.md 4.5: keeping focus is the accessibility
      // requirement, and react-datepicker opens whenever the field is focused.
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("5.2 keeps an accessible name when the label is visually hidden", () => {
      render(<DatePicker label="Departure date" showLabel={false} />);
      expect(screen.getByRole("textbox")).toHaveAccessibleName(
        "Departure date",
      );
    });

    it("3.6 never renders month/year dropdowns or the time picker", async () => {
      const { container } = render(
        <DatePicker label="Date" selected={SEPT_15} />,
      );
      await userEvent.click(getInput());
      await screen.findByRole("dialog");

      for (const selector of [
        ".react-datepicker__month-dropdown-container",
        ".react-datepicker__year-dropdown-container",
        ".react-datepicker__month-year-dropdown-container",
        ".react-datepicker__time-container",
      ]) {
        expect(container.querySelector(selector)).toBeNull();
      }
    });

    it("6.5 renders on the server without touching browser APIs", async () => {
      // Guards against a browser-only side effect creeping into the module
      // graph, which would break SSR consumers at import time.
      const { renderToString } = await import("react-dom/server");
      const html = renderToString(
        <DatePicker
          instruction="Pick"
          label="Date"
          selected={SEPT_15}
          showInstruction
        />,
      );
      expect(html).toContain("hig__text-field-v1");
      expect(html).toContain("09/15/2017");
    });

    it("6.4 forwards a ref to the live react-datepicker instance", () => {
      const ref = createRef<ReactDatePickerInstance>();
      render(<DatePicker label="Date" ref={ref} selected={SEPT_15} />);
      expect(ref.current).not.toBeNull();
      expect(typeof ref.current?.setOpen).toBe("function");
    });
  });

  describe("axe", () => {
    it("has no violations when closed", async () => {
      const { container } = render(
        <DatePicker
          instruction="Choose a date"
          label="Select a date"
          selected={SEPT_15}
          showClearButton
          showInstruction
        />,
      );
      expect(await axeViolations(container)).toEqual([]);
    });

    it("has no violations with the label visually hidden", async () => {
      // New code path: the icon's <label> is then the only label element and
      // carries no text, with the name supplied via aria-label.
      const { container } = render(
        <DatePicker
          label="Departure date"
          selected={SEPT_15}
          showLabel={false}
        />,
      );
      expect(await axeViolations(container)).toEqual([]);
    });

    it("has no violations when the calendar is open", async () => {
      const { container } = render(
        <DatePicker label="Select a date" selected={SEPT_15} />,
      );
      await userEvent.click(getInput());
      await screen.findByRole("dialog");
      expect(await axeViolations(container)).toEqual([]);
    });
  });
});
