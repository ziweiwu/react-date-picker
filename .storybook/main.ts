import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook builds straight from `src/`, exactly as the demo does, so what you
 * interact with here is the real component rather than a compiled snapshot.
 *
 * The static build is published to GitHub Pages by `.github/workflows/pages.yml`
 * and linked from the README, which is also what npm shows on the package page.
 */
const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  // Storybook phones home with anonymous usage data by default. There is no
  // reason for a CI build of a public docs site to do that.
  core: { disableTelemetry: true },
  // Served from https://<user>.github.io/react-date-picker/, not from a domain
  // root, so every asset URL has to be relative or the page loads a blank shell.
  viteFinal: (config) => ({ ...config, base: "./" }),
};

export default config;
