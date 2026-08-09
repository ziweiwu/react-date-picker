import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "es/**",
      "lib/**",
      "css/**",
      "types/**",
      "demo/dist/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.{ts,tsx,mts,mjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: { react: { version: "detect" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.strict.rules,
      // Types are declared in TypeScript; React 19 ignores propTypes anyway.
      "react/prop-types": "off",
      // Bindings prefixed with _ are intentionally discarded (e.g. props
      // destructured only to keep them out of a rest spread).
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-unused-vars": "off",
    },
  },
  {
    // Build scripts are plain ESM JavaScript, not part of the TS program.
    files: ["scripts/**/*.mjs", "*.config.mjs"],
    ...tseslint.configs.disableTypeChecked,
  },
  // Last: switches off every rule that would disagree with Prettier, so the
  // formatter and the linter cannot fight over the same line.
  prettier,
);
