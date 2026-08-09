import { useState } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import DatePicker from "./index.js";
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

/** Minimal stand-in for a moment/dayjs instance. */
function momentLike(date: Date): DateLike {
  return { toDate: () => date };
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
        <DatePicker
          instruction="Choose a date"
          label="Date"
          showInstruction
        />,
      );
      expect(getInput()).toHaveAccessibleDescription("Choose a date");
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
      const { container } = render(<DatePicker label="Date" showIcon={false} />);
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
      for (const attr of ["calender", "showlabel", "showinstruction", "instruction"]) {
        expect(input).not.toHaveAttribute(attr);
      }
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
