"use client";

import { useEffect, useRef, useState } from "react";
import type { LoaderBootstrapState } from "@/lib/loader-bootstrap";
import { waveShape } from "@/lib/wave";

type LoaderPhase = "initializing" | "drawing" | "glow-fade" | "hold" | "cover" | "reveal" | "complete" | "fallback" | "reduced";
type OfficialAnimation = {
  timeline: { totalTime: () => number; duration: () => number; timeScale: () => number };
  offscreen: boolean;
  play: () => void;
  destroy: () => void;
};
type LogoElement = HTMLDivElement & { animation?: OfficialAnimation };
type LoaderWindow = Window & {
  gsap?: typeof import("gsap").gsap;
  RanzWordmark?: unknown[];
  RanzLogoAnimation?: new (root: HTMLElement, options: {
    duration: number;
    autoplay: boolean;
    onStateChange: (state: string) => void;
  }) => OfficialAnimation;
  __ranzLoaderBootstrap?: LoaderBootstrapState;
};

const fallbackMarkup = '<img class="loader-static-white" src="/brand/wordmark-white.svg" width="800" height="208" alt="Ranz.dev"><img class="loader-static-black" src="/brand/wordmark-black.svg" width="800" height="208" alt="Ranz.dev">';
let officialSources: Promise<typeof import("gsap").gsap> | undefined;

function loadOriginalScript(src: string, available: () => boolean) {
  if (available()) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.dataset.portfolioMotion = "official";
    const clear = () => { script.onload = null; script.onerror = null; };
    script.onload = () => {
      clear();
      if (available()) resolve();
      else reject(new Error("The supplied animation source did not initialize."));
    };
    script.onerror = () => {
      clear();
      script.remove();
      reject(new Error("The supplied animation source could not be loaded."));
    };
    document.head.append(script);
  });
}

function getOfficialSources() {
  if (!officialSources) {
    officialSources = (async () => {
      const { gsap } = await import("gsap");
      const host = window as LoaderWindow;
      await loadOriginalScript("/motion/wordmark-data.js", () => host.RanzWordmark?.length === 11);
      await loadOriginalScript("/motion/animation.js", () => typeof host.RanzLogoAnimation === "function");
      return gsap;
    })().catch((error: unknown) => {
      officialSources = undefined;
      throw error;
    });
  }
  return officialSources;
}

function exitEase(t: number) {
  const value = (s: number, a: number, b: number) =>
    3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 18; i++) {
    const middle = (low + high) / 2;
    if (value(middle, .68, .2) < t) low = middle;
    else high = middle;
  }
  return value((low + high) / 2, 0, 1);
}

export function PortfolioLoader() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const loader = loaderRef.current;
    const root = loader?.querySelector<LogoElement>("#loaderLogo");
    const surface = loader?.querySelector<HTMLDivElement>(".loader-surface");
    const center = loader?.querySelector<HTMLDivElement>(".loader-center");
    const sheet = loader?.querySelector<SVGPathElement>("#loaderExitPath");
    if (!loader || !root || !surface || !center || !sheet) return;

    const host = window as LoaderWindow;
    const bootstrap = host.__ranzLoaderBootstrap;
    const owner = {};
    if (bootstrap) bootstrap.owner = owner;
    const html = document.documentElement;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const storageKey = "ranz.portfolio.v2.1.tab";
    const namePrefix = "ranz-v21:";
    const documentId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    let phase: LoaderPhase = "initializing";
    let phaseTime = 0;
    let activeTotal = 0;
    let last = performance.now();
    let frame = 0;
    let disposed = false;
    let ended = false;
    let covered = false;
    let coverTime = 0;
    let dissolve = false;
    let decided = false;
    let duplicate = false;
    let animationDone = false;
    let fontsReady = !document.fonts;
    let ready = document.readyState === "complete";
    let lastProgress = 0;
    let stalledFor = 0;
    let logo: OfficialAnimation | undefined;
    let glow: HTMLElement[] = [];
    let glowStart: number[] = [];
    let ownedGsap: LoaderWindow["gsap"];
    let previousGsap: LoaderWindow["gsap"];
    let channel: BroadcastChannel | undefined;
    let stored: { id: string; complete: boolean } | null = null;
    try { stored = JSON.parse(sessionStorage.getItem(storageKey) || "null"); } catch { /* Storage may be denied. */ }
    const oldName = window.name;
    const namedId = oldName.startsWith(namePrefix) ? oldName.slice(namePrefix.length).split("|")[0] : null;
    let tabId = namedId || documentId;
    if (!stored && namedId) stored = { id: namedId, complete: oldName.endsWith("|complete") };
    const sameTab = stored?.id === tabId;

    function writeStorage(complete: boolean) {
      window.name = namePrefix + tabId + (complete ? "|complete" : "");
      try { sessionStorage.setItem(storageKey, JSON.stringify({ id: tabId, complete })); } catch { /* window.name remains the same-tab fallback. */ }
    }
    function freshIdentity() {
      tabId = documentId;
      writeStorage(false);
    }
    // A navigation can inherit a completed name and storage from another tab.
    // Replay with a new identity without waiting for a throttled owner response.
    const completedNavigation = sameTab && stored?.complete && navigation?.type === "navigate";
    if (!sameTab || completedNavigation) freshIdentity();

    try {
      channel = new BroadcastChannel("ranz-portfolio-v21-tabs");
      channel.onmessage = ({ data }) => {
        if (!data || data.tabId !== tabId || data.documentId === documentId) return;
        if (data.type === "probe") channel?.postMessage({ type: "owned", tabId, documentId, to: data.documentId });
        if (data.type === "owned" && data.to === documentId && !decided) duplicate = true;
      };
      channel.postMessage({ type: "probe", tabId, documentId });
    } catch { /* Fresh navigation conservatively replays when a channel is unavailable. */ }

    const protectedElements = html.hasAttribute("data-loader-active")
      ? [...document.body.children].filter((element): element is HTMLElement =>
        element instanceof HTMLElement && !["SCRIPT", "NOSCRIPT"].includes(element.tagName) && element !== loader,
      ).map((element) => ({ element, inert: element.inert }))
      : [];
    protectedElements.forEach(({ element, inert }) => {
      element.dataset.loaderInert = String(inert);
      element.inert = true;
    });

    function releasePage() {
      html.removeAttribute("data-loader-active");
      protectedElements.forEach(({ element, inert }) => {
        element.inert = inert;
        delete element.dataset.loaderInert;
      });
    }
    function phaseTo(value: LoaderPhase) {
      phase = value;
      phaseTime = 0;
      loader!.dataset.phase = value;
      loader!.dispatchEvent(new CustomEvent("loaderphase", { bubbles: true, detail: { phase: value, activeTime: activeTotal } }));
      try { performance.mark("portfolio:loader:" + value, { detail: { activeTime: activeTotal } }); } catch { /* Diagnostic marks are optional. */ }
    }
    function destroyLogo() {
      logo?.destroy();
      logo = undefined;
      delete root!.animation;
      if (ownedGsap && host.gsap === ownedGsap) {
        if (previousGsap) host.gsap = previousGsap;
        else delete host.gsap;
      }
      ownedGsap = undefined;
    }
    function finish() {
      if (ended || disposed) return;
      ended = true;
      cancelAnimationFrame(frame);
      phaseTo("complete");
      writeStorage(true);
      releasePage();
      bootstrap?.stop();
      if (bootstrap?.onTimeout === emergencyRelease) delete bootstrap.onTimeout;
      destroyLogo();
      setRemoved(true);
      document.dispatchEvent(new Event("portfolio:ready"));
    }
    function staticPresentation(value: "fallback" | "reduced") {
      destroyLogo();
      root!.innerHTML = fallbackMarkup;
      root!.dataset.animationState = value === "fallback" ? "fallback" : "static";
      animationDone = true;
      sheet!.setAttribute("d", waveShape(0));
      phaseTo(value);
    }
    function emergencyRelease() {
      if (disposed || ended) return;
      loader!.dataset.failure = "emergency-watchdog";
      phaseTo("fallback");
      finish();
    }
    if (bootstrap) bootstrap.onTimeout = emergencyRelease;

    function startAnimation() {
      writeStorage(false);
      if (motion.matches) {
        staticPresentation("reduced");
        return;
      }
      void getOfficialSources().then((gsap) => {
        if (disposed || ended || phase !== "initializing") return;
        if (motion.matches) { staticPresentation("reduced"); return; }
        try {
          const Constructor = host.RanzLogoAnimation;
          if (!Constructor || !window.IntersectionObserver) throw new Error("Animation support unavailable.");
          previousGsap = host.gsap;
          ownedGsap = gsap;
          host.gsap = gsap;
          logo = new Constructor(root!, {
            duration: 3.6,
            autoplay: false,
            onStateChange(state) { if (state === "complete") animationDone = true; },
          });
          root!.animation = logo;
          glow = [...root!.querySelectorAll<HTMLElement>("[data-bloom],[data-near],[data-wordmark-bloom],.ranz-backdrop")];
          phaseTo("drawing");
          logo.play();
        } catch { staticPresentation("fallback"); }
      }, () => {
        if (!disposed && !ended && phase === "initializing") staticPresentation("fallback");
      });
    }
    function cover() {
      covered = true;
      coverTime = activeTotal;
      loader!.dataset.covered = "true";
      loader!.dataset.waveProgress = "0.50000";
      surface!.hidden = true;
      center!.hidden = true;
      center!.style.visibility = "hidden";
      releasePage();
    }
    function tick(now: number) {
      if (disposed || ended) return;
      const dt = document.hidden ? 0 : Math.max(0, (now - last) / 1000);
      last = now;
      phaseTime += dt;
      activeTotal += dt;
      bootstrap?.heartbeat();
      if (phase === "initializing") {
        if (!decided && phaseTime >= .12) {
          decided = true;
          if (duplicate) freshIdentity();
          const maySkip = sameTab && stored?.complete && !duplicate &&
            (navigation?.type === "reload" || navigation?.type === "back_forward");
          if (maySkip) { finish(); return; }
          startAnimation();
        } else if (decided && phaseTime > 2.12) staticPresentation("fallback");
      } else if (phase === "drawing") {
        const progress = logo?.timeline.totalTime() || 0;
        stalledFor = progress > lastProgress || logo?.offscreen ? 0 : stalledFor + dt;
        lastProgress = progress;
        if (animationDone) {
          glowStart = glow.map((element) => parseFloat(getComputedStyle(element).opacity) || 0);
          phaseTo("glow-fade");
        } else if (stalledFor > 2) staticPresentation("fallback");
      } else if (phase === "glow-fade") {
        const progress = Math.min(1, phaseTime / .25);
        glow.forEach((element, index) => { element.style.opacity = String(glowStart[index] * (1 - progress)); });
        if (progress === 1) phaseTo("hold");
      } else if (phase === "hold" || phase === "fallback" || phase === "reduced") {
        const hold = phase === "fallback" ? .7 : .3;
        const imagesReady = [...document.images].every((image) => image.complete);
        if (phaseTime >= hold && ((ready && fontsReady && imagesReady) || activeTotal > 15)) {
          dissolve = motion.matches;
          phaseTo(dissolve ? "reveal" : "cover");
        }
      } else if (phase === "cover") {
        if (covered) {
          if (activeTotal - coverTime >= .06) phaseTo("reveal");
        } else {
          const progress = Math.min(1, phaseTime / .95);
          const eased = exitEase(progress);
          if (eased >= .44) {
            sheet!.setAttribute("d", waveShape(.5));
            cover();
          } else {
            sheet!.setAttribute("d", waveShape(eased));
            loader!.dataset.waveProgress = eased.toFixed(5);
          }
        }
      } else if (phase === "reveal") {
        if (dissolve) {
          releasePage();
          loader!.style.opacity = String(1 - Math.min(1, phaseTime / .4));
          if (phaseTime >= .4) { finish(); return; }
        } else {
          const progress = Math.min(1, phaseTime / .42);
          const waveProgress = .56 + .44 * exitEase(progress);
          sheet!.setAttribute("d", waveShape(waveProgress));
          loader!.dataset.waveProgress = waveProgress.toFixed(5);
          if (progress === 1) { finish(); return; }
        }
      }
      if (!ended) frame = requestAnimationFrame(tick);
    }

    const onVisibility = () => { last = performance.now(); };
    const onLoad = () => { ready = true; };
    const onPageHide = () => channel?.close();
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) finish(); };
    const onMotionChange = () => {
      if (disposed || ended || !motion.matches || phase === "initializing") return;
      if (!covered) staticPresentation("reduced");
      else { dissolve = true; phaseTo("reveal"); }
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("load", onLoad, { once: true });
    window.addEventListener("pagehide", onPageHide);
    window.addEventListener("pageshow", onPageShow);
    motion.addEventListener("change", onMotionChange);
    if (document.fonts) void document.fonts.ready.then(() => { fontsReady = true; }, () => { fontsReady = true; });
    sheet.setAttribute("d", waveShape(0));
    phaseTo("initializing");
    if (!bootstrap || bootstrap.expired || html.hasAttribute("data-loader-skip") || !html.hasAttribute("data-loader-active")) {
      queueMicrotask(finish);
    } else {
      loader.dataset.running = "true";
      frame = requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      destroyLogo();
      channel?.close();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("pagehide", onPageHide);
      window.removeEventListener("pageshow", onPageShow);
      motion.removeEventListener("change", onMotionChange);
      protectedElements.forEach(({ element, inert }) => {
        element.inert = inert;
        delete element.dataset.loaderInert;
      });
      if (bootstrap?.onTimeout === emergencyRelease) delete bootstrap.onTimeout;
      // Strict Mode immediately installs the replacement owner before this runs.
      queueMicrotask(() => {
        if (bootstrap?.owner === owner && !ended) {
          releasePage();
          bootstrap.stop();
          delete bootstrap.owner;
        }
      });
    };
  }, []);

  if (removed) return null;
  return (
    <div ref={loaderRef} id="loader" className="loader" data-phase="initializing"
      aria-label="Loading website" role="status" aria-live="polite">
      <span className="loader-sr">Preparing the portfolio.</span>
      <div className="loader-surface" />
      <div className="loader-center">
        <div id="loaderLogo" className="ranz-logo" dangerouslySetInnerHTML={{ __html: fallbackMarkup }} />
      </div>
      <svg className="loader-exit" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        <path id="loaderExitPath" d="M0 1400H1000V2600H0Z" />
      </svg>
    </div>
  );
}