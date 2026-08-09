import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const FIELD = ".hig__text-field-v1";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(FIELD).first()).toBeVisible();
});

test("opens the calendar below the field and picks a date", async ({ page }) => {
  const input = page.getByLabel("Select a date");
  await input.click();

  const calendar = page.locator(".react-datepicker");
  await expect(calendar).toBeVisible();

  // The popper is pinned below the input and left-aligned with it
  // (popperPlacement="bottom-start", flip disabled), as in 0.x.
  const field = await input.boundingBox();
  const popper = await calendar.boundingBox();
  expect(popper.y).toBeGreaterThan(field.y);
  expect(Math.abs(popper.x - field.x)).toBeLessThan(40);

  await page.locator(".react-datepicker__day--015").first().click();
  await expect(calendar).toBeHidden();
  await expect(input).not.toHaveValue("");
});

test("the field is a calendar trigger, not a text input", async ({ page }) => {
  const input = page.getByLabel("Select a date");
  await expect(input).toHaveAttribute("readonly", "");
  await expect(input).toBeEnabled();

  await input.click();
  await page.keyboard.type("abcd");
  await expect(input).not.toHaveValue(/abcd/);
});

test("is reachable and operable by keyboard alone", async ({ page }) => {
  await page.keyboard.press("Tab");
  const input = page.getByLabel("Select a date");
  await expect(input).toBeFocused();

  await expect(page.locator(".react-datepicker")).toBeVisible();

  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(input).not.toHaveValue("");
});

test("keyboard focus is always visible", async ({ page }) => {
  // Regression: 0.x set `outline: 0` on the icon button and relied on a
  // disabled input, leaving keyboard users with no focus affordance.
  await page.keyboard.press("Tab");
  const outline = await page
    .getByLabel("Select a date")
    .evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe("none");
});

test("clear button resets the value", async ({ page }) => {
  const input = page.getByLabel("Select a date");
  await input.click();
  await page.locator(".react-datepicker__day--015").first().click();
  await expect(input).not.toHaveValue("");

  await page.getByRole("button", { name: /clear date/i }).click();
  await expect(input).toHaveValue("");
});

test("keeps the HIG visual invariants", async ({ page }) => {
  const input = page.getByLabel("Select a date");
  await input.click();
  await expect(page.locator(".react-datepicker")).toBeVisible();
  // Let the floating-label transition settle before measuring.
  await page.waitForTimeout(400);

  // The calendar keeps a sans-serif stack; a bare `ArtifaktElement` would
  // silently fall back to the browser's serif default.
  await expect(page.locator(".react-datepicker")).toHaveCSS(
    "font-family",
    /sans-serif/,
  );

  // HIG day cells are square in every state.
  const day = page.locator(".react-datepicker__day--020").first();
  await day.hover();
  await expect(day).toHaveCSS("border-radius", "0px");

  // The focus ring must not strike through the floating label's text. The
  // label's line box is taller than its glyphs, so half-leading is removed
  // before comparing - that gap is empty space, not visible overlap.
  const overlap = await page.evaluate(() => {
    const i = document.querySelector(".hig__text-field-v1__input");
    const l = document.querySelector(".hig__text-field-v1__label");
    const ls = getComputedStyle(l);
    const halfLeading =
      (parseFloat(ls.lineHeight) - parseFloat(ls.fontSize)) / 2;
    const inkBottom = l.getBoundingClientRect().bottom - halfLeading;
    const offset = parseFloat(getComputedStyle(i).outlineOffset) || 0;
    const ringTop = i.getBoundingClientRect().top - offset;
    return inkBottom - ringTop;
  });
  expect(overlap).toBeLessThanOrEqual(0);
});

test("no axe violations, including real colour contrast", async ({ page }) => {
  // Runs in a real browser, so unlike the jsdom suite this genuinely
  // evaluates the WCAG contrast ratios of the rendered palette.
  const closed = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(closed.violations).toEqual([]);

  await page.getByLabel("Select a date").click();
  await expect(page.locator(".react-datepicker")).toBeVisible();

  const open = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(open.violations).toEqual([]);
});
