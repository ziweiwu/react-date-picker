import type { Preview } from "@storybook/react-vite";
import "../src/styles/datePicker.scss";

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    // The calendar is a popper anchored below the field, so it needs vertical
    // room; the default `padded` layout clips it inside the story frame.
    layout: "fullscreen",
    // Fail a story on an accessibility violation rather than only flagging it.
    // This component's whole selling point is being accessible, so a story that
    // regresses that should go red.
    a11y: { test: "error" },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          fontFamily: "system-ui, sans-serif",
          padding: 24,
          minHeight: 420,
        }}
      >
        <Story />
      </div>
    ),
  ],
};

export default preview;
