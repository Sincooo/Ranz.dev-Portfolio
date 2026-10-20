import { expect, test, type Page } from "@playwright/test";

type Phase = { phase: string; activeTime: number; wallTime: number };
type Coverage = { full: boolean; fill: string; center: string; surface: string };
type MotionEvidence = {
  phases: Phase[];
  earlyExposure: string[];
  visibleLoaderFrames: string[];
  coverage?: Coverage;
  coverageFrozen: boolean;
  phaseFrozen: boolean;
};
type DiagnosticWindow = Window & { __portfolioMotionQA: MotionEvidence };
type LogoElement = HTMLElement & {
  animation?: {
    timeline: { duration(): number; timeScale(): number; progress(): number };
    pause(): void;
  };
};

const previewPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAABWklEQVQ4y2NgAAJpaekQYVHRA8LCwi+A9Ee8GKLmgLScXDADTDO/oOBPXn7+/6RgkB5pefkgBpBpIIHomJj/+/bvx4o3bd78v6m5+b+UjAyKISKiovsYhERFn0FN/L9w0aL/+MDdu3f/S8vKwg0A6WUQFhF5g2yqnoHBf1t7exQcFx///+PHj2BDauvq4GpBejEMwIW3bd8ONgDkSrwGODo7/8/Lz0fB9Q0N/799+wY2oKy8HL8BsvLy/69cvYo1DC5cuPBfTFycsBdU1dX/379/H65x/YYN/zOzsv4LiYigqMMbBrr6+v+fPX8ONuDylSv/ZeTkMNQQDERzC4v/7969Axty6PDh/6JIzic6FkCB+uXLF7AhoJgQFBZGNQCWkPBhXz+//z9+/AAbsmLFCnCiQyQkaFImhKOio//v27cPnLQjo6IQSZnizATOkUAG0LT9xGZnkFqYZgC5DKuMtd8/yQAAAABJRU5ErkJggg==",
  "base64",
);

function recordErrors(page: Page, expectedFailurePath?: string) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const location = message.location().url;
    if (expectedFailurePath && location.includes(expectedFailurePath) &&
      /ERR_FAILED|ERR_ABORTED/.test(message.text())) return;
    errors.push(location + ": " + message.text());
  });
  return errors;
}

async function installEvidence(
  page: Page,
  options: { freezeAtCoverage?: boolean; freezeOnPhase?: string } = {},
) {
  await page.addInitScript((settings) => {
    const evidence: MotionEvidence = {
      phases: [], earlyExposure: [], visibleLoaderFrames: [],
      coverageFrozen: false, phaseFrozen: false,
    };
    (window as unknown as DiagnosticWindow).__portfolioMotionQA = evidence;
    function freezeVisibility() {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      document.dispatchEvent(new Event("visibilitychange"));
    }
    function inspectCoverage(loader: HTMLElement) {
      const path = loader.querySelector<SVGGeometryElement>("#loaderExitPath");
      if (!path || evidence.coverage) return;
      let full = true;
      for (let x = 0; x <= 1000; x += 10) {
        for (let y = 0; y <= 1000; y += 10) {
          if (!path.isPointInFill(new DOMPoint(x, y))) full = false;
        }
      }
      const center = loader.querySelector(".loader-center");
      const surface = loader.querySelector(".loader-surface");
      const centerStyle = center ? getComputedStyle(center) : null;
      evidence.coverage = {
        full, fill: getComputedStyle(path).fill,
        center: centerStyle?.display === "none" ? "hidden" : centerStyle?.visibility || "missing",
        surface: surface ? getComputedStyle(surface).display : "missing",
      };
    }
    document.addEventListener("loaderphase", (event) => {
      const detail = (event as CustomEvent<{ phase: string; activeTime: number }>).detail;
      evidence.phases.push({ ...detail, wallTime: performance.now() });
    }, true);
    new MutationObserver(() => {
      const loader = document.querySelector<HTMLElement>("#loader");
      if (!loader) return;
      if (settings.freezeOnPhase === loader.dataset.phase && !evidence.phaseFrozen) {
        evidence.phaseFrozen = true;
        freezeVisibility();
      }
      if (loader.dataset.covered === "true") {
        inspectCoverage(loader);
        if (settings.freezeAtCoverage && !evidence.coverageFrozen) {
          evidence.coverageFrozen = true;
          freezeVisibility();
        }
      }
    }).observe(document, {
      subtree: true, childList: true, attributes: true,
      attributeFilter: ["data-phase", "data-covered"],
    });
    function sampleFrame() {
      const loader = document.querySelector<HTMLElement>("#loader");
      if (loader) {
        const style = getComputedStyle(loader);
        const phase = loader.dataset.phase || "initializing";
        if (style.display !== "none" && style.visibility !== "hidden" &&
          Number(style.opacity) > 0 && evidence.visibleLoaderFrames.length < 20) {
          evidence.visibleLoaderFrames.push(phase);
        }
        if (loader.dataset.covered !== "true" && !["reveal", "complete"].includes(phase)) {
          for (const selector of ["#home", ".site-header"]) {
            const element = document.querySelector(selector);
            if (element && getComputedStyle(element).visibility !== "hidden" &&
              evidence.earlyExposure.length < 10) {
              evidence.earlyExposure.push(selector + " during " + phase);
            }
          }
        }
      }
      requestAnimationFrame(sampleFrame);
    }
    requestAnimationFrame(sampleFrame);
  }, options);
}

async function resumeVisibility(page: Page) {
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "hidden");
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

async function waitForPhase(page: Page, phase: string) {
  await expect(page.locator("#loader")).toHaveAttribute("data-phase", phase, { timeout: 15_000 });
}

async function capture(page: Page, name: string) {
  await test.info().attach(name, { body: await page.screenshot(), contentType: "image/png" });
}

async function evidence(page: Page) {
  return page.evaluate(() => (window as unknown as DiagnosticWindow).__portfolioMotionQA);
}

async function expectSceneCoverage(page: Page, expectedFill: string) {
  await expect(page.locator("#waveOverlay")).toBeVisible();
  await expect.poll(() => page.locator("#wavePath").evaluate((element) => {
    const path = element as SVGGeometryElement;
    for (let x = 0; x <= 1000; x += 50) {
      for (let y = 0; y <= 1000; y += 50) {
        if (!path.isPointInFill(new DOMPoint(x, y))) return false;
      }
    }
    return true;
  })).toBe(true);
  await expect(page.locator("#wavePath")).toHaveCSS("fill", expectedFill);
}

test("official loader, readiness, coverage, scroll reveal and session handoff", async ({ page, context }) => {
  test.setTimeout(60_000);
  test.info().annotations.push({
    type: "LIMITED",
    description: "Visibility uses a controlled document.hidden override; cloned storage/name is not the browser's native Duplicate action.",
  });
  const errors = recordErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await installEvidence(page, { freezeAtCoverage: true });

  // A real pending image request holds the browser's load readiness gate.
  let releaseReadiness!: () => void;
  const readinessGate = new Promise<void>((resolve) => { releaseReadiness = resolve; });
  await page.route("**/qa-readiness.png", async (route) => {
    await readinessGate;
    await route.fulfill({ contentType: "image/png", body: previewPng });
  });
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const image = document.createElement("img");
      image.hidden = true;
      image.alt = "";
      image.src = "/qa-readiness.png";
      document.body.append(image);
    }, { once: true });
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForPhase(page, "drawing");
    const presentation = await page.locator("#loaderLogo").evaluate((element) => {
      const logo = element as LogoElement;
      const rect = logo.getBoundingClientRect();
      return {
        duration: logo.animation!.timeline.duration() / logo.animation!.timeline.timeScale(),
        transform: getComputedStyle(logo).transform,
        centerX: rect.x + rect.width / 2,
        centerY: rect.y + rect.height / 2,
        backdrop: getComputedStyle(document.querySelector(".loader-surface")!).backgroundColor,
      };
    });
    expect(presentation.duration).toBeCloseTo(3.6, 5);
    expect(presentation.transform).toBe("matrix(0.8, 0, 0, 0.8, 0, 0)");
    expect(presentation.centerX).toBeCloseTo(720, 0);
    expect(presentation.centerY).toBeCloseTo(450, 0);
    expect(presentation.backdrop).toBe("rgb(13, 14, 13)");
    await expect(page.locator("#loader button, #loader input")).toHaveCount(0);
    await capture(page, "loader-opening");

    const pausedAt = await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      document.dispatchEvent(new Event("visibilitychange"));
      return (document.querySelector("#loaderLogo") as LogoElement).animation!.timeline.progress();
    });
    // Observe a real elapsed interval while the simulated hidden state is active.
    await page.waitForTimeout(350);
    expect(await page.locator("#loaderLogo").evaluate((element) =>
      (element as LogoElement).animation!.timeline.progress(),
    )).toBeCloseTo(pausedAt, 6);
    await resumeVisibility(page);
    await expect.poll(() => page.locator("#loaderLogo").evaluate((element) =>
      (element as LogoElement).animation!.timeline.progress(),
    )).toBeGreaterThan(pausedAt);

    await waitForPhase(page, "hold");
    const completeMark = await page.locator("#loaderLogo").evaluate((element) => ({
      transform: element.querySelector("[data-monogram]")?.getAttribute("transform"),
      glyphOpacity: [...element.querySelectorAll("[data-core], [data-glyph]")]
        .map((glyph) => Number(getComputedStyle(glyph).opacity)),
      glowOpacity: [...element.querySelectorAll("[data-bloom], [data-near], [data-wordmark-bloom], .ranz-backdrop")]
        .map((glow) => Number(getComputedStyle(glow).opacity)),
    }));
    expect(completeMark.glyphOpacity.length).toBeGreaterThan(1);
    expect(completeMark.glyphOpacity.every((opacity) => opacity >= 0.99)).toBe(true);
    expect(completeMark.glowOpacity.every((opacity) => opacity <= 0.001)).toBe(true);
    await capture(page, "loader-completed-wordmark");
    // The completed mark must remain held beyond its minimum while load is pending.
    await page.waitForTimeout(350);
    await expect(page.locator("#loader")).toHaveAttribute("data-phase", "hold");
    expect(await page.locator("#loaderLogo [data-monogram]").getAttribute("transform"))
      .toBe(completeMark.transform);
    releaseReadiness();

    await page.waitForFunction(() =>
      (window as unknown as DiagnosticWindow).__portfolioMotionQA.coverageFrozen,
    );
    const coverage = (await evidence(page)).coverage;
    expect(coverage).toEqual({
      full: true, fill: "rgb(60, 64, 61)", center: "hidden", surface: "none",
    });
    await capture(page, "loader-exit-full-coverage");
    const frozenPhase = await page.locator("#loader").getAttribute("data-phase");
    await page.waitForTimeout(350);
    await expect(page.locator("#loader")).toHaveAttribute("data-phase", frozenPhase!);
    await resumeVisibility(page);
    await expect(page.locator("#loader")).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator("#sceneTrack")).toHaveClass(/motion-ready/);
    await expect(page.locator("#heroTitle")).toBeVisible();
    await capture(page, "loader-completed-hero");

    const loaderEvidence = await evidence(page);
    const phases = loaderEvidence.phases;
    const phaseTime = (name: string) => phases.find((phase) => phase.phase === name)!.activeTime;
    expect(phases.map((phase) => phase.phase)).toEqual(expect.arrayContaining([
      "drawing", "glow-fade", "hold", "cover", "reveal", "complete",
    ]));
    expect(phaseTime("hold") - phaseTime("glow-fade")).toBeGreaterThanOrEqual(0.25 - 1e-6);
    expect(phaseTime("cover") - phaseTime("hold")).toBeGreaterThanOrEqual(0.3 - 1e-6);
    expect(loaderEvidence.earlyExposure).toEqual([]);
    await test.info().attach("loader-observations", {
      body: Buffer.from(JSON.stringify({ presentation, ...loaderEvidence }, null, 2)),
      contentType: "application/json",
    });

    for (const [theme, color] of [["dark", "rgb(60, 64, 61)"], ["light", "rgb(184, 188, 182)"]]) {
      if (theme === "light") {
        await page.getByRole("button", { name: "Switch to light mode" }).click();
        await expect(page.locator("body")).toHaveClass(/theme-light/);
      }
      const height = await page.locator("#sceneStage").evaluate((element) => element.clientHeight);
      await page.mouse.wheel(0, height * 0.52);
      await expectSceneCoverage(page, color);
      await capture(page, `scroll-wave-covered-${theme}`);
      await page.mouse.wheel(0, height * 1.42);
      await expect(page.locator("#progressNumber")).toHaveText("100%");
      const letters = page.locator(".intro-letter");
      expect(await letters.count()).toBeGreaterThan(30);
      await expect(page.locator(".intro-letter:not(.illuminated)")).toHaveCount(0);
      await expect(page.locator("#introHeading")).toBeInViewport();
      await capture(page, `introduction-${theme}`);
      await page.mouse.wheel(0, -height * 0.4);
      await expect(page.locator("#progressNumber")).toHaveText("100%");
      await expect(page.locator(".intro-letter:not(.illuminated)")).toHaveCount(0);
      await page.keyboard.press("Control+Home");
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
      await expect(page.locator("#heroTitle")).toBeVisible();
      await expect(page.locator("#loader")).toHaveCount(0);
    }

    await page.reload({ waitUntil: "domcontentloaded" });
    await page.evaluate(() => new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    ));
    expect((await evidence(page)).visibleLoaderFrames).toEqual([]);
    await expect(page.locator("html")).not.toHaveAttribute("data-loader-active", "");
    await expect(page.locator("#loader")).toBeHidden();
    await expect(page.locator("#heroTitle")).toBeVisible();

    const state = await page.evaluate(() => ({
      name: window.name,
      storage: sessionStorage.getItem("ranz.portfolio.v2.1.tab"),
    }));
    const clone = await context.newPage();
    try {
      await clone.addInitScript((saved) => {
        window.name = saved.name;
        if (saved.storage) sessionStorage.setItem("ranz.portfolio.v2.1.tab", saved.storage);
      }, state);
      await clone.goto("/", { waitUntil: "domcontentloaded" });
      await waitForPhase(clone, "drawing");
      expect(await clone.evaluate(() => window.name)).not.toBe(state.name);
    } finally {
      await clone.close();
    }
    test.info().annotations.push({
      type: "LIMITED",
      description: "A silent BroadcastChannel simulates an owner response delayed beyond the session decision; this is not native browser duplication.",
    });
    const silentClone = await context.newPage();
    try {
      await silentClone.addInitScript((saved) => {
        window.name = saved.name;
        if (saved.storage) sessionStorage.setItem("ranz.portfolio.v2.1.tab", saved.storage);
        Object.defineProperty(window, "BroadcastChannel", {
          configurable: true,
          value: class SilentBroadcastChannel {
            onmessage: ((event: MessageEvent) => void) | null = null;
            postMessage() { /* Deliberately withhold every owner response. */ }
            close() { /* No native channel was opened. */ }
          },
        });
      }, state);
      await silentClone.goto("/", { waitUntil: "domcontentloaded" });
      await waitForPhase(silentClone, "drawing");
      expect(await silentClone.evaluate(() => window.name)).not.toBe(state.name);
    } finally {
      await silentClone.close();
    }
    const freshTab = await context.newPage();
    try {
      await freshTab.goto("/", { waitUntil: "domcontentloaded" });
      await waitForPhase(freshTab, "drawing");
    } finally {
      await freshTab.close();
    }
    expect(errors).toEqual([]);
  } finally {
    releaseReadiness();
    await resumeVisibility(page);
  }
});

test("reduced motion uses the static mark and a 0.4s dissolve with denied storage", async ({ page }) => {
  const errors = recordErrors(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await installEvidence(page, { freezeOnPhase: "reduced" });
  await page.addInitScript(() => {
    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() { throw new DOMException("QA storage denial", "SecurityError"); },
    });
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => (window as unknown as DiagnosticWindow).__portfolioMotionQA.phaseFrozen);
  await expect(page.locator("#loaderLogo")).toHaveAttribute("data-animation-state", "static");
  await expect(page.locator(".loader-static-white")).toBeVisible();
  expect(await page.locator("#loaderLogo").evaluate((element) =>
    Boolean((element as LogoElement).animation),
  )).toBe(false);
  await capture(page, "reduced-motion-static-wordmark");
  await resumeVisibility(page);
  await expect(page.locator("#loader")).toHaveCount(0, { timeout: 10_000 });
  const observed = await evidence(page);
  expect(observed.coverage).toBeUndefined();
  expect(observed.phases.some((phase) => phase.phase === "drawing" || phase.phase === "cover")).toBe(false);
  const reveal = observed.phases.find((phase) => phase.phase === "reveal")!;
  const complete = observed.phases.find((phase) => phase.phase === "complete")!;
  expect(complete.activeTime - reveal.activeTime).toBeGreaterThanOrEqual(0.4 - 1e-6);
  await expect(page.locator("#sceneTrack")).not.toHaveClass(/motion-ready/);
  await page.getByRole("link", { name: "SCROLL TO EXPLORE", exact: true }).click();
  await expect(page.locator("#introHeading")).toBeInViewport();
  await expect(page.locator("#waveOverlay")).toBeHidden();
  await capture(page, "reduced-motion-readable-introduction");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())));
  expect((await evidence(page)).visibleLoaderFrames).toEqual([]);
  await expect(page.locator("#loader")).toBeHidden();
  expect(errors).toEqual([]);
});

for (const failure of ["missing", "stalled"] as const) {
  test(`${failure} official animation recovers through the static fallback`, async ({ page }) => {
    const errors = recordErrors(page, failure === "missing" ? "/motion/animation.js" : undefined);
    await installEvidence(page, { freezeOnPhase: "fallback" });
    if (failure === "missing") {
      await page.route("**/motion/animation.js", (route) => route.abort("failed"));
    }
    await page.goto("/", { waitUntil: "domcontentloaded" });
    if (failure === "stalled") {
      await waitForPhase(page, "drawing");
      await page.locator("#loaderLogo").evaluate((element) =>
        (element as LogoElement).animation!.pause(),
      );
    }
    await page.waitForFunction(() => (window as unknown as DiagnosticWindow).__portfolioMotionQA.phaseFrozen);
    await expect(page.locator("#loaderLogo")).toHaveAttribute("data-animation-state", "fallback");
    await expect(page.locator(".loader-static-white")).toBeVisible();
    await capture(page, `${failure}-animation-static-fallback`);
    await resumeVisibility(page);
    await expect(page.locator("#loader")).toHaveCount(0, { timeout: 15_000 });
    await expect(page.locator("#heroTitle")).toBeVisible();
    expect((await evidence(page)).earlyExposure).toEqual([]);
    expect(errors).toEqual([]);
  });
}

type WatchdogObservation = {
  startedAt: number;
  activeSeen: boolean;
  releasedAt: number | null;
  initiallyHidden: boolean;
  hiddenEvents: boolean[];
};
type WatchdogWindow = Window & {
  __watchdogQA: WatchdogObservation;
  __ranzLoaderBootstrap?: { expired: boolean };
};

async function installWatchdogObservation(page: Page) {
  await page.addInitScript(() => {
    const observed: WatchdogObservation = {
      startedAt: performance.now(), activeSeen: false, releasedAt: null,
      initiallyHidden: document.hidden, hiddenEvents: [],
    };
    (window as unknown as WatchdogWindow).__watchdogQA = observed;
    document.addEventListener("visibilitychange", () => {
      observed.hiddenEvents.push(document.hidden);
    });
    new MutationObserver(() => {
      if (document.documentElement?.hasAttribute("data-loader-active")) {
        observed.activeSeen = true;
      } else if (observed.activeSeen && observed.releasedAt === null) {
        observed.releasedAt = performance.now();
      }
    }).observe(document, {
      subtree: true, attributes: true, attributeFilter: ["data-loader-active"],
    });
  });
}

test("pending image readiness escapes after 15 foreground seconds without truncating the logo", async ({ page }) => {
  test.setTimeout(25_000);
  test.info().annotations.push({
    type: "LIMITED",
    description: "Real elapsed foreground time on managed Chromium; native background-tab behavior is not established.",
  });
  const errors = recordErrors(page);
  await installEvidence(page);
  await installWatchdogObservation(page);
  let releaseImage!: () => void;
  const imageGate = new Promise<void>((resolve) => { releaseImage = resolve; });
  await page.route("**/qa-watchdog-readiness.png", async (route) => {
    await imageGate;
    await route.fulfill({ contentType: "image/png", body: previewPng });
  });
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const image = document.createElement("img");
      image.id = "qaPendingReadiness";
      image.hidden = true;
      image.alt = "";
      image.src = "/qa-watchdog-readiness.png";
      document.body.append(image);
    }, { once: true });
  });
  try {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await waitForPhase(page, "hold");
    await expect(page.locator("#loaderLogo")).toHaveAttribute("data-animation-state", "complete");
    expect(await page.locator("#loaderLogo").evaluate((element) =>
      (element as LogoElement).animation!.timeline.progress(),
    )).toBeCloseTo(1, 6);
    expect(await page.locator("#qaPendingReadiness").evaluate((element) =>
      (element as HTMLImageElement).complete,
    )).toBe(false);
    await capture(page, "readiness-watchdog-completed-mark-hold");

    // The request remains pending throughout the escape; no clock or app state is advanced.
    await expect(page.locator("#loader")).toHaveCount(0, { timeout: 19_000 });
    await expect(page.locator("#heroTitle")).toBeVisible();
    expect(await page.locator("#qaPendingReadiness").evaluate((element) =>
      (element as HTMLImageElement).complete,
    )).toBe(false);
    const observed = await evidence(page);
    const cover = observed.phases.find((phase) => phase.phase === "cover");
    expect(cover).toBeDefined();
    expect(cover!.activeTime).toBeGreaterThanOrEqual(15);
    expect(observed.phases.map((phase) => phase.phase)).toEqual(expect.arrayContaining([
      "drawing", "glow-fade", "hold", "cover", "reveal", "complete",
    ]));
    expect(observed.coverage?.full).toBe(true);
    expect(observed.earlyExposure).toEqual([]);
    const watchdog = await page.evaluate(() => ({
      ...((window as unknown as WatchdogWindow).__watchdogQA),
      bootstrapExpired: (window as unknown as WatchdogWindow).__ranzLoaderBootstrap?.expired,
    }));
    expect(watchdog.initiallyHidden).toBe(false);
    expect(watchdog.hiddenEvents).not.toContain(true);
    expect(watchdog.bootstrapExpired).toBe(false);
    await capture(page, "readiness-watchdog-recovered-hero");
    await test.info().attach("readiness-watchdog-observations", {
      body: Buffer.from(JSON.stringify({ watchdog, loader: observed }, null, 2)),
      contentType: "application/json",
    });
    expect(errors).toEqual([]);
  } finally {
    releaseImage();
  }
});

test("inline bootstrap releases readable content when application JavaScript never loads", async ({ page }) => {
  test.setTimeout(25_000);
  test.info().annotations.push({
    type: "LIMITED",
    description: "Real elapsed foreground time on managed Chromium; native background-tab behavior is not established.",
  });
  const nextScript = /\/_next\/static\/[^?#]+\.js(?:[?#].*)?$/;
  const blockedUrls = new Set<string>();
  const expectedFailures: string[] = [];
  const unexpectedErrors: string[] = [];
  page.on("pageerror", (error) => unexpectedErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const description = request.url() + ": " + request.failure()?.errorText;
    if (blockedUrls.has(request.url())) expectedFailures.push(description);
    else unexpectedErrors.push(description);
  });
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const location = message.location().url;
    const description = location + ": " + message.text();
    if (blockedUrls.has(location) && /ERR_FAILED|ERR_ABORTED/.test(message.text())) {
      expectedFailures.push(description);
    } else {
      unexpectedErrors.push(description);
    }
  });
  await page.route(nextScript, (route) => {
    blockedUrls.add(route.request().url());
    return route.abort("failed");
  });
  await installWatchdogObservation(page);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(blockedUrls.size).toBeGreaterThan(0);
  await expect(page.locator("html")).toHaveAttribute("data-loader-active", "");
  await expect(page.locator("#loader")).toBeVisible();
  await expect(page.locator("#heroTitle")).toBeHidden();

  await page.waitForFunction(() =>
    (window as unknown as WatchdogWindow).__ranzLoaderBootstrap?.expired === true,
    undefined,
    { timeout: 20_000 },
  );
  const observed = await page.evaluate(() => (window as unknown as WatchdogWindow).__watchdogQA);
  expect(observed.activeSeen).toBe(true);
  expect(observed.initiallyHidden).toBe(false);
  expect(observed.hiddenEvents).not.toContain(true);
  expect(observed.releasedAt).not.toBeNull();
  expect(observed.releasedAt! - observed.startedAt).toBeGreaterThanOrEqual(15_000);
  await expect(page.locator("html")).not.toHaveAttribute("data-loader-active", "");
  await expect(page.locator("#loader")).toBeHidden();
  await expect(page.locator("#heroTitle")).toBeVisible();
  await expect(page.locator("#sceneTrack")).not.toHaveClass(/motion-ready/);
  await capture(page, "hydration-watchdog-readable-hero");
  await page.getByRole("link", { name: "SCROLL TO EXPLORE", exact: true }).click();
  await expect(page.locator("#introHeading")).toBeInViewport();
  await expect(page.locator("#waveOverlay")).toBeHidden();
  await capture(page, "hydration-watchdog-readable-introduction");
  expect(expectedFailures.length).toBeGreaterThan(0);
  await test.info().attach("hydration-watchdog-observations", {
    body: Buffer.from(JSON.stringify({ observed, blockedUrls: [...blockedUrls], expectedFailures }, null, 2)),
    contentType: "application/json",
  });
  expect(unexpectedErrors).toEqual([]);
});
