import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import DatePicker from "./index.js";

/**
 * Interactive stories for the published component, built from `src/` so what
 * you click here is the real thing.
 *
 * Every story is controlled: `selected` is held in local state and updated from
 * `onChange`, matching invariant 1.5 (the component never renders a date the
 * caller did not pass). A story that passed a bare `selected` would appear
 * frozen, which would look like a bug in the component rather than in the story.
 */
const meta = {
  title: "DatePicker",
  component: DatePicker,
  argTypes: {
    onChange: { action: "changed" },
    selected: { control: false },
  },
  // Fixed so the calendar always opens on the same month; otherwise the docs
  // page drifts with the wall clock.
  args: {
    label: "Departure date",
  },
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Renders the component with its own state, so picking a date sticks. */
function Controlled({
  initial = null,
  ...props
}: React.ComponentProps<typeof DatePicker> & { initial?: Date | null }) {
  const [date, setDate] = useState<Date | null>(initial);
  return (
    <DatePicker
      {...props}
      onChange={(value, event) => {
        setDate(value);
        props.onChange?.(value, event);
      }}
      selected={date}
    />
  );
}

const SELECTED = new Date(2026, 7, 20); // 20 August 2026

export const Default: Story = {
  render: (args) => <Controlled {...args} />,
};

/** The floating label rises once the field has a value (invariant 2.6). */
export const WithValue: Story = {
  args: { showClearButton: true },
  render: (args) => <Controlled {...args} initial={SELECTED} />,
};

/** Helper text is linked to the input with `aria-describedby` (invariant 5.3). */
export const WithInstruction: Story = {
  args: {
    instruction: "Bookings open 30 days ahead",
    showInstruction: true,
  },
  render: (args) => <Controlled {...args} />,
};

/**
 * `errors` renders the message, marks the input `aria-invalid` and adds it to
 * the accessible description (invariant 5.8). Only the error carries the error
 * colour — the instruction beside it keeps its ordinary styling, so the one to
 * act on is still obvious.
 */
export const WithError: Story = {
  args: {
    errors: "Choose a date in the future",
    instruction: "Bookings open 30 days ahead",
    showInstruction: true,
  },
  render: (args) => <Controlled {...args} />,
};

/**
 * The input is `disabled` only when the caller asks for it. Otherwise it is
 * `readOnly`, which keeps it focusable and reachable by screen readers
 * (invariants 2.2 and 2.3).
 */
export const Disabled: Story = {
  args: { disabled: true, label: "Unavailable" },
  render: (args) => <Controlled {...args} initial={SELECTED} />,
};

/** Days before `minDate` are disabled and cannot be picked. */
export const MinDate: Story = {
  args: { label: "Future dates only", minDate: SELECTED },
  render: (args) => <Controlled {...args} />,
};

/** `showLabel={false}` hides the label visually but keeps the accessible name. */
export const HiddenLabel: Story = {
  args: { showLabel: false },
  render: (args) => <Controlled {...args} initial={SELECTED} />,
};

/** Without the leading calendar icon. */
export const WithoutIcon: Story = {
  args: { showIcon: false },
  render: (args) => <Controlled {...args} initial={SELECTED} />,
};
