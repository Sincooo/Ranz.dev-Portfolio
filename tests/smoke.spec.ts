import { expect, test, type Locator, type Page } from "@playwright/test";

const introduction =
  "I learn by building, turning curiosity into things people can experience.";

// Completed-page measurements recorded by the supplied V2.1 desktop QA.
const desktopReferences = [
  {
    width: 1920,
    height: 1080,
    name: { x: 400, y: 409.140625, width: 742.40625, height: 138.53125 },
    font: 72.1619,
    portrait: { x: 1220, y: 308.5, width: 300, height: 375 },
    brand: { x: 400, y: 30.5, width: 122.859375, height: 27 },
  },
  {
    width: 1440,
    height: 900,
    name: { x: 160, y: 327.546875, width: 748.8125, height: 139.71875 },
    font: 72.7846,
    portrait: { x: 980, y: 227.5, width: 300, height: 375 },
    brand: { x: 160, y: 32.5, width: 107.6875, height: 23 },
  },
  {
    width: 1280,
    height: 720,
    name: { x: 80, y: 246.9375, width: 755.21875, height: 140.9375 },
    font: 73.4073,
    portrait: { x: 900, y: 161.203125, width: 300, height: 345.59375 },
    brand: { x: 80, y: 33.5, width: 95.734375, height: 21 },
  },
];

function recordRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.location().url + ": " + message.text());
    }
  });
  return errors;
}

async function openPortfolio(page: Page) {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("#loader")).toHaveCount(0, { timeout: 20_000 });
  await expect(page.locator("#heroTitle")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator("#sceneTrack")).toHaveClass(/motion-ready/);
}

async function expectBounds(
  locator: Locator,
  expected: { x: number; y: number; width: number; height: number },
) {
  await expect
    .poll(async () => {
      const actual = await locator.boundingBox();
      if (!actual) return Number.POSITIVE_INFINITY;
      return Math.max(
        ...(["x", "y", "width", "height"] as const).map((key) =>
          Math.abs(actual[key] - expected[key]),
        ),
      );
    })
    .toBeLessThanOrEqual(2);
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

async function expectTheme(page: Page, theme: "dark" | "light") {
  await expect(page.locator("body")).toHaveClass(new RegExp(`theme-${theme}`));
  // Wait for the preserved palette transition before measuring or capturing.
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    theme === "dark" ? "rgb(13, 14, 13)" : "rgb(233, 231, 225)",
  );
  await expect(page.locator("body")).toHaveCSS(
    "color",
    theme === "dark" ? "rgb(241, 240, 236)" : "rgb(32, 33, 31)",
  );
  await expect(page.locator(".brand-white")).toHaveAttribute(
    "src",
    "/brand/wordmark-white.svg",
  );
  await expect(page.locator(".brand-black")).toHaveAttribute(
    "src",
    "/brand/wordmark-black.svg",
  );
  await expect(page.locator(theme === "dark" ? ".brand-white" : ".brand-black"))
    .toBeVisible();
  await expect(page.locator(theme === "dark" ? ".brand-black" : ".brand-white"))
    .toBeHidden();
  for (const filename of [
    "favicon.svg",
    "favicon.ico",
    "favicon-16.png",
    "favicon-32.png",
  ]) {
    await expect(
      page.locator(`link[rel~="icon"][href="/favicons/${theme}/${filename}"]`),
    ).toHaveCount(1);
  }
  await expect(page.locator('link[rel~="icon"][href^="/favicons/"]')).toHaveCount(4);
  await expect(page.locator(
    `link[rel~="icon"][href^="/favicons/${theme === "dark" ? "light" : "dark"}/"]`,
  )).toHaveCount(0);
}

test("V2.1 desktop composition and official theme assets are preserved", async ({
  page,
}) => {
  const errors = recordRuntimeErrors(page);
  await openPortfolio(page);
  await expect(page.locator("#heroTitle")).toContainText("EDWARD");
  await expect(page.locator("#heroTitle")).toContainText("RANZ");
  await expect(page.locator("#heroTitle")).toContainText("CARDOZA");
  await expect(page.getByText("Computer Science Student", { exact: true })).toBeVisible();
  await expect(page.locator(".hero-statement")).toHaveText(
    "Transforming ideas into interactive digital experiences through code and design.",
  );
  await expect(page.locator("#introHeading")).toHaveText(introduction);

  for (const reference of desktopReferences) {
    await page.setViewportSize({ width: reference.width, height: reference.height });
    for (const theme of ["dark", "light"] as const) {
      await expectTheme(page, theme);
      await expectBounds(page.locator("#heroTitle"), reference.name);
      await expectBounds(page.locator(".portrait-frame"), reference.portrait);
      await expectBounds(page.locator(".brand"), reference.brand);
      await expect
        .poll(async () =>
          Math.abs(
            (await page.locator("#heroTitle").evaluate((element) =>
              parseFloat(getComputedStyle(element).fontSize),
            )) - reference.font,
          ),
        )
        .toBeLessThanOrEqual(1);
      await expectNoHorizontalOverflow(page);
      await test.info().attach(`hero-${reference.width}x${reference.height}-${theme}`, {
        body: await page.screenshot(),
        contentType: "image/png",
      });
      await page.getByRole("button", {
        name: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
      }).click();
    }
  }
  await expectTheme(page, "dark");

  const brand = page.getByRole("img", { name: "Ranz.dev", exact: true });
  await expect(page.locator(".site-header")).toHaveCSS("position", "absolute");
  expect(await brand.evaluate((element) => element.closest("a"))).toBeNull();
  const beforeHover = await brand.boundingBox();
  await brand.hover();
  await expect(page.locator(".brand-white")).toHaveCSS("transition-duration", "0.2s");
  await expect(page.locator(".brand-white")).not.toHaveCSS("filter", "none");
  expect(await brand.boundingBox()).toEqual(beforeHover);
  expect(errors).toEqual([]);
});

test("menu keyboard access, pending links, and local portrait preview work", async ({
  page,
}) => {
  const errors = recordRuntimeErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPortfolio(page);
  const menu = page.locator("#siteMenu");
  const openMenu = page.locator("#menuToggle");
  const closeMenu = menu.getByRole("button", { name: "Close menu" });
  await expect(menu).toHaveAttribute("role", "dialog");
  await expect(menu).toHaveAttribute("aria-hidden", "true");
  expect(await menu.evaluate((element) => (element as HTMLElement).inert)).toBe(true);

  await openMenu.focus();
  await page.keyboard.press("Enter");
  await expect(openMenu).toHaveAttribute("aria-expanded", "true");
  await expect(menu).toHaveAttribute("aria-hidden", "false");
  await expect(closeMenu).toBeFocused();
  for (const selector of ["main", ".site-header"]) {
    expect(await page.locator(selector).evaluate((element) => (element as HTMLElement).inert))
      .toBe(true);
  }
  await page.keyboard.press("Shift+Tab");
  await expect(menu.getByRole("link", { name: /Introduction/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(closeMenu).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(openMenu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-hidden", "true");
  for (const selector of ["main", ".site-header"]) {
    expect(await page.locator(selector).evaluate((element) => (element as HTMLElement).inert))
      .toBe(false);
  }

  await openMenu.click();
  await page.locator("#menuBackdrop").click({ position: { x: 20, y: 200 } });
  await expect(openMenu).toBeFocused();
  await expect(openMenu).toHaveAttribute("aria-expanded", "false");
  await openMenu.click();
  await menu.getByRole("link", { name: /Introduction/ }).click();
  await expect(page).toHaveURL(/#introduction$/);
  await expect(page.locator("#introHeading")).toBeInViewport();
  await expect(menu).toHaveAttribute("aria-hidden", "true");
  await openMenu.scrollIntoViewIfNeeded();
  await openMenu.click();
  await menu.getByRole("link", { name: /Home/ }).click();
  await expect(page).toHaveURL(/#home$/);
  await expect(page.locator("#heroTitle")).toBeInViewport();

  for (const [name, label] of [
    ["GitHub", "GitHub URL pending"],
    ["LinkedIn", "LinkedIn URL pending"],
    ["Instagram", "Instagram URL pending"],
    ["Email", "Email address pending"],
  ]) {
    const link = page.getByRole("link", { name: label, exact: true });
    await expect(link).toHaveAttribute("href", "#");
    await link.click();
    await expect(page.getByRole("status")).toContainText(name);
  }

  const uploadRequests: string[] = [];
  page.on("request", (request) => {
    if (["POST", "PUT", "PATCH"].includes(request.method())) {
      uploadRequests.push(request.url());
    }
  });
  await page.locator("#photoInput").setInputFiles({
    name: "qa-preview.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAABWklEQVQ4y2NgAAJpaekQYVHRA8LCwi+A9Ee8GKLmgLScXDADTDO/oOBPXn7+/6RgkB5pefkgBpBpIIHomJj/+/bvx4o3bd78v6m5+b+UjAyKISKiovsYhERFn0FN/L9w0aL/+MDdu3f/S8vKwg0A6WUQFhF5g2yqnoHBf1t7exQcFx///+PHj2BDauvq4GpBejEMwIW3bd8ONgDkSrwGODo7/8/Lz0fB9Q0N/799+wY2oKy8HL8BsvLy/69cvYo1DC5cuPBfTFycsBdU1dX/379/H65x/YYN/zOzsv4LiYigqMMbBrr6+v+fPX8ONuDylSv/ZeTkMNQQDERzC4v/7969Axty6PDh/6JIzic6FkCB+uXLF7AhoJgQFBZGNQCWkPBhXz+//z9+/AAbsmLFCnCiQyQkaFImhKOio//v27cPnLQjo6IQSZnizATOkUAG0LT9xGZnkFqYZgC5DKuMtd8/yQAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await expect(page.locator(".portrait-frame")).toHaveClass(/has-image/);
  const portrait = page.locator("#portraitImage");
  await expect(portrait).toHaveAttribute("src", /^blob:/);
  await expect(portrait).toBeVisible();
  await expect.poll(() => portrait.evaluate((element) =>
    (element as HTMLImageElement).complete && (element as HTMLImageElement).naturalWidth > 0,
  )).toBe(true);
  expect(uploadRequests).toEqual([]);
  expect(errors).toEqual([]);
});

test("narrow and short viewports keep content and controls reachable", async ({ page }) => {
  const errors = recordRuntimeErrors(page);
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 580 }]) {
    await page.setViewportSize(viewport);
    await openPortfolio(page);
    await expectNoHorizontalOverflow(page);
    await expect(page.locator("#heroTitle")).toBeVisible();
    await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeInViewport();
    await page.getByRole("button", { name: "Switch to light mode" }).click();
    await expectTheme(page, "light");
    await test.info().attach(`regression-${viewport.width}x${viewport.height}`, {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    await page.getByRole("link", { name: "SCROLL TO EXPLORE", exact: true }).click();
    await expect(page.locator("#introHeading")).toBeInViewport();
    await expect(page.locator("#introHeading")).toHaveText(introduction);
    await expectNoHorizontalOverflow(page);
  }
  expect(errors).toEqual([]);
});

test("portfolio content and introduction navigation remain usable without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
    viewport: { width: 1440, height: 900 },
  });
  try {
    const page = await context.newPage();
    const errors = recordRuntimeErrors(page);
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.locator("#heroTitle")).toBeVisible();
    await expect(page.getByText("Computer Science Student", { exact: true })).toBeVisible();
    await expect(page.locator("#introHeading")).toHaveText(introduction);
    await expect(page.locator("#loader")).toBeHidden();
    await expect(page.locator("#waveOverlay")).toBeHidden();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to introduction" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#introduction$/);
    await expect(page.locator("#introHeading")).toBeInViewport();
    await expectNoHorizontalOverflow(page);
    await test.info().attach("no-javascript-introduction", {
      body: await page.screenshot(),
      contentType: "image/png",
    });
    expect(errors).toEqual([]);
  } finally {
    await context.close();
  }
});
