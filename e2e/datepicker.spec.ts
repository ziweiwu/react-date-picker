import { expect, test, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/** `boundingBox()` returns null for elements that are not rendered. */
async function box(locator: Locator) {
  const value = await locator.boundingBox();
  if (!value) throw new Error("expected element to have a bounding box");
  return value;
}

const FIELD = ".hig__text-field-v1";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(FIELD).first()).toBeVisible();
});

test("opens the calendar below the field and picks a date", async ({
  page,
}) => {
  const input = page.getByLabel("Select a date");
  await input.click();

  const calendar = page.locator(".react-datepicker");
  await expect(calendar).toBeVisible();

  // The popper is placed below the input and left-aligned with it
  // (popperPlacement="bottom-start"), as in 0.x. That is a preference rather
  // than a guarantee - react-datepicker always runs its own `flip` first and
  // this wrapper cannot remove it - so it is asserted here at a viewport with
  // room to honour it. The short-viewport case is covered separately below.
  const field = await box(input);
  const popper = await box(calendar);
  expect(popper.y).toBeGreaterThan(field.y);
  expect(Math.abs(popper.x - field.x)).toBeLessThan(40);

  await page.locator(".react-datepicker__day--015").first().click();
  await expect(calendar).toBeHidden();
  await expect(input).not.toHaveValue("");
});

// Short viewports used to push the calendar partly outside the viewport: at
// 1280x350 it was placed at y=-133, putting the month header and both
// navigation buttons above the top edge where they could be neither clicked
// nor scrolled to. The `size` middleware in DatePicker.tsx now caps the
// calendar to the space actually available.
const SHORT_VIEWPORTS = [
  { width: 1280, height: 400 },
  { width: 1280, height: 350 },
  { width: 1280, height: 300 },
  { width: 667, height: 375 }, // iPhone SE, landscape
  { width: 280, height: 400 },
];

for (const viewport of SHORT_VIEWPORTS) {
  test(`calendar stays inside a ${viewport.width}x${viewport.height} viewport`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.getByLabel("Select a date").click();

    const calendar = page.locator(".react-datepicker");
    await expect(calendar).toBeVisible();

    const rect = await box(calendar);
    expect(rect.y).toBeGreaterThanOrEqual(0);
    expect(rect.y + rect.height).toBeLessThanOrEqual(viewport.height);

    // The month navigation is the part that went out of reach, so assert it
    // specifically rather than trusting the calendar's own box.
    for (const selector of [
      ".react-datepicker__current-month",
      ".react-datepicker__navigation--next",
    ]) {
      const control = await box(page.locator(selector));
      expect(control.y).toBeGreaterThanOrEqual(0);
      expect(control.y + control.height).toBeLessThanOrEqual(viewport.height);
    }
  });
}

test("keyboard focus stays visible when the calendar has to scroll", async ({
  page,
}) => {
  // Capping the calendar's height made it a scroll container, and
  // react-datepicker focuses day cells with `focus({preventScroll: true})`.
  // Without the `focusin` handler in DatePicker.tsx the keyboard cursor walked
  // straight out of the clipped area and became invisible.
  await page.setViewportSize({ width: 1280, height: 250 });
  await page.getByLabel("Select a date").click();

  const calendar = page.locator(".react-datepicker");
  await expect(calendar).toBeVisible();
  // The premise of the test: the calendar really is overflowing here.
  expect(
    await calendar.evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true);

  // The first ArrowDown moves focus from the input into the day grid; the
  // rest walk down a week at a time, which is what used to scroll the cursor
  // out of sight.
  await page.keyboard.press("ArrowDown");
  for (let step = 0; step < 5; step += 1) {
    await page.keyboard.press("ArrowDown");

    const visible = await calendar.evaluate((el) => {
      const active = document.activeElement;
      if (!active || !active.classList.contains("react-datepicker__day")) {
        return null;
      }
      const day = active.getBoundingClientRect();
      const box = el.getBoundingClientRect();
      return (
        day.top >= box.top - 0.5 &&
        day.bottom <= box.bottom + 0.5 &&
        day.top >= 0 &&
        day.bottom <= window.innerHeight
      );
    });

    expect(visible, `focused day hidden after ${step + 2} ArrowDown`).toBe(
      true,
    );
  }
});

test("no horizontal page scroll at the 1.4.10 reflow width", async ({
  page,
}) => {
  // WCAG 2.2 AA 1.4.10 Reflow is specified at 320 CSS px. Below that the
  // field's own vendored `min-width: 230px` overflows before the calendar
  // does, so 320 is the width the component actually guarantees.
  await page.setViewportSize({ width: 320, height: 700 });
  await page.getByLabel("Select a date").click();
  await expect(page.locator(".react-datepicker")).toBeVisible();

  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth - root.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(0);
});

// Narrower than the field's own `min-width: 230px`, so the page already
// scrolls sideways before the calendar is involved at all. What must hold is
// that *opening* the calendar adds nothing to it. A 261-272px band used to
// fail this: `size` measured the available width from the viewport edge while
// `shift` had already committed the calendar to sitting 15px in, so the cap
// was 15px too generous and the calendar hung over the right edge.
for (const width of [255, 261, 267, 270, 273, 280, 300]) {
  test(`opening the calendar adds no horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 620 });

    const overflow = () =>
      page.evaluate(() => {
        const root = document.documentElement;
        return root.scrollWidth - root.clientWidth;
      });

    const closed = await overflow();
    await page.getByLabel("Select a date").click();
    await expect(page.locator(".react-datepicker")).toBeVisible();

    expect(await overflow()).toBeLessThanOrEqual(closed);
  });
}

test("month navigation meets the WCAG 2.5.8 minimum target size", async ({
  page,
}) => {
  await page.getByLabel("Select a date").click();
  await expect(page.locator(".react-datepicker")).toBeVisible();

  // 24x24 CSS px. The caret glyph stays 15px; the padding around it is what
  // makes the target big enough without relying on the spacing exception.
  for (const selector of [
    ".react-datepicker__navigation--previous",
    ".react-datepicker__navigation--next",
  ]) {
    const target = await box(page.locator(selector));
    expect(target.width).toBeGreaterThanOrEqual(24);
    expect(target.height).toBeGreaterThanOrEqual(24);
  }
});

test("Escape closes the calendar and keeps focus on the field", async ({
  page,
}) => {
  const input = page.getByLabel("Select a date");
  await input.click();
  await expect(page.locator(".react-datepicker")).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(page.locator(".react-datepicker")).toBeHidden();
  // react-datepicker 9.1 keeps the field focused here. Older versions blurred
  // it, which INVARIANTS.md 3.2 recorded as a known deviation from the ARIA
  // combobox pattern; this pins the better behaviour so a future upgrade that
  // regresses it is caught rather than silently accepted.
  await expect(input).toBeFocused();
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

test("clicking the calendar icon opens the calendar", async ({ page }) => {
  // INVARIANTS.md 2.5. jsdom forwards label clicks generously, so this is
  // verified against a real browser as well.
  await page.locator(".hig__text-field-v1__icon").first().click();
  await expect(page.locator(".react-datepicker")).toBeVisible();
  await expect(page.getByLabel("Select a date")).toBeFocused();
});

test("clearing keeps focus on the field", async ({ page }) => {
  // INVARIANTS.md 4.4 - the clear button unmounts itself, so focus must not
  // fall through to <body>.
  const input = page.getByLabel("Select a date");
  await input.click();
  await page.locator(".react-datepicker__day--015").first().click();
  await expect(input).not.toHaveValue("");

  await page.getByRole("button", { name: /clear date/i }).click();
  await expect(input).toHaveValue("");
  await expect(input).toBeFocused();
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
    const i = document.querySelector<HTMLInputElement>(
      ".hig__text-field-v1__input",
    );
    const l = document.querySelector<HTMLLabelElement>(
      ".hig__text-field-v1__label",
    );
    if (!i || !l) throw new Error("field or label missing");
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

test("no axe violations in a month padded to six week rows", async ({
  page,
}) => {
  // `fixedHeight` pads a five-row month out to six, and that sixth row is made
  // entirely of adjacent-month days. Hidden one cell at a time, it left an
  // empty `role="row"` behind - a critical `aria-required-children` violation.
  // 28 of the 36 months in 2025-2027 are padded like this, but the general axe
  // test above only ever sees whichever month CI happens to run in, so the
  // clock is pinned here to a month that definitely has one.
  await page.clock.setFixedTime(new Date("2026-09-15T12:00:00"));
  await page.goto("/");
  await page.getByLabel("Select a date").click();
  await expect(page.locator(".react-datepicker")).toBeVisible();

  // The premise: September 2026 really does get an all-outside-month row.
  const paddingRows = await page
    .locator(".react-datepicker__week")
    .evaluateAll(
      (weeks) =>
        weeks.filter((week) =>
          [...week.querySelectorAll(".react-datepicker__day")].every((day) =>
            day.classList.contains("react-datepicker__day--outside-month"),
          ),
        ).length,
    );
  expect(paddingRows).toBe(1);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("the error state is wired up and contrast-checked in a real browser", async ({
  page,
}) => {
  // jsdom cannot sample rendered pixels, so axe's colour-contrast rule is off
  // in the unit suite. Until the demo grew an error fixture, nothing measured
  // `$hig-error` against white in a real browser at all.
  const input = page.getByLabel("Return date");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveAccessibleDescription(
    "Bookings open 30 days ahead Choose a date in the future",
  );

  // The error message is the only part of the helper text that carries the
  // error treatment; the instruction keeps its ordinary styling, so the two
  // are still told apart at a glance.
  const errorColor = await page
    .locator(".hig__text-field-v1__errors")
    .evaluate((el) => getComputedStyle(el).color);
  const instructionColor = await page
    .locator(
      ".hig__text-field-v1--with-errors .hig__text-field-v1__instructions",
    )
    .evaluate((el) => getComputedStyle(el).color);
  expect(errorColor).toBe("rgb(192, 57, 43)");
  expect(instructionColor).not.toBe(errorColor);

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});

test("a focused field keeps a visible underline while showing an error", async ({
  page,
}) => {
  // Both modifier classes are single selectors, so before the combined rule
  // the later declaration won and focusing an errored field dropped the
  // underline back to its unfocused 1px.
  const input = page.getByLabel("Return date");
  await input.focus();

  const wrapper = page
    .locator(
      ".hig__text-field-v1--with-errors .hig__text-field-v1__input-wrapper",
    )
    .first();
  await expect(wrapper).toHaveCSS("border-bottom-width", "2px");
  await expect(wrapper).toHaveCSS("border-bottom-color", "rgb(192, 57, 43)");
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
