"use client";

import { useEffect } from "react";
import { clampProgress, smoothProgress, waveShape } from "@/lib/wave";

export function usePortfolioMotion() {
  useEffect(() => {
    let disposed = false;
    let release: (() => void) | undefined;

    async function initialize() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;

      const track = document.querySelector<HTMLElement>("#sceneTrack");
      const stage = document.querySelector<HTMLElement>("#sceneStage");
      const hero = document.querySelector<HTMLElement>("#home");
      const intro = document.querySelector<HTMLElement>("#introduction");
      const wave = document.querySelector<SVGSVGElement>("#waveOverlay");
      const path = document.querySelector<SVGPathElement>("#wavePath");
      const fill = document.querySelector<HTMLElement>("#progressFill");
      const number = document.querySelector<HTMLElement>("#progressNumber");
      if (!track || !stage || !hero || !intro || !wave || !path || !fill || !number) return;

      const letters = [...intro.querySelectorAll<HTMLElement>(".intro-letter")];
      const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
      let revealedMax = 0;
      let trigger: ReturnType<typeof ScrollTrigger.create> | undefined;
      let context: ReturnType<typeof gsap.context> | undefined;
      gsap.registerPlugin(ScrollTrigger);

      function makeReadable() {
        revealedMax = 1;
        track!.classList.remove("motion-ready");
        stage!.classList.remove("show-intro");
        hero!.inert = false;
        intro!.inert = false;
        hero!.removeAttribute("aria-hidden");
        intro!.removeAttribute("aria-hidden");
        wave!.style.display = "none";
        letters.forEach((letter) => letter.classList.add("illuminated"));
        fill!.style.width = "100%";
        number!.textContent = "100%";
      }

      function update() {
        if (disposed || preference.matches || document.hidden) return;
        const height = stage!.clientHeight;
        const y = Math.max(0, window.scrollY - track!.offsetTop);
        const waveProgress = clampProgress((y - height * 0.12) / (height * 0.8));
        const showIntro = waveProgress >= 0.5;

        wave!.style.display = waveProgress > 0 && waveProgress < 1 ? "block" : "none";
        path!.setAttribute("d", waveShape(waveProgress));
        stage!.classList.toggle("show-intro", showIntro);
        hero!.inert = showIntro;
        intro!.inert = !showIntro;
        hero!.setAttribute("aria-hidden", String(showIntro));
        intro!.setAttribute("aria-hidden", String(!showIntro));

        revealedMax = Math.max(
          revealedMax,
          smoothProgress(height * 0.92, height * 1.9, y),
        );
        const count = Math.floor(revealedMax * letters.length);
        letters.forEach((letter, index) =>
          letter.classList.toggle("illuminated", index < count),
        );
        const percent = Math.round(revealedMax * 100);
        fill!.style.width = percent + "%";
        number!.textContent = String(percent).padStart(2, "0") + "%";
      }

      function scrollToSection(hash: string, smooth: boolean) {
        if (!track!.classList.contains("motion-ready")) return;
        const top = hash === "#introduction"
          ? track!.offsetTop + stage!.clientHeight * 0.94
          : track!.offsetTop;
        window.scrollTo({
          top,
          behavior: smooth && !preference.matches ? "smooth" : "instant",
        });
      }

      function onNavigation(event: MouseEvent) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const element = event.target instanceof Element ? event.target : null;
        const anchor = element?.closest<HTMLAnchorElement>('a[href="#introduction"], a[href="#home"]');
        if (!anchor || !track!.classList.contains("motion-ready")) return;
        event.preventDefault();
        if (window.location.hash !== anchor.hash) {
          window.history.pushState(null, "", anchor.hash);
        }
        scrollToSection(anchor.hash, true);
      }

      function onHistory() {
        scrollToSection(window.location.hash, false);
      }

      function configure() {
        trigger?.kill();
        context?.revert();
        if (preference.matches) {
          makeReadable();
          return;
        }

        track!.classList.add("motion-ready");
        context = gsap.context(() => {
          trigger = ScrollTrigger.create({
            id: "portfolio-scene",
            trigger: track,
            start: "top top",
            end: () => "+=" + stage!.clientHeight * 2,
            onUpdate: update,
            onRefresh: update,
          });
        }, track!);
        ScrollTrigger.refresh();
        update();
      }

      function onReady() {
        ScrollTrigger.refresh();
        update();
      }

      release = () => {
        preference.removeEventListener("change", configure);
        document.removeEventListener("click", onNavigation);
        document.removeEventListener("visibilitychange", update);
        document.removeEventListener("portfolio:ready", onReady);
        window.removeEventListener("popstate", onHistory);
        window.removeEventListener("hashchange", onHistory);
        trigger?.kill();
        context?.revert();
        makeReadable();
      };

      configure();
      if (window.location.hash === "#introduction") onHistory();
      preference.addEventListener("change", configure);
      document.addEventListener("click", onNavigation);
      document.addEventListener("visibilitychange", update);
      document.addEventListener("portfolio:ready", onReady);
      window.addEventListener("popstate", onHistory);
      window.addEventListener("hashchange", onHistory);


    }

    // The server-rendered document remains readable if motion cannot initialize.
    void initialize().catch(() => {
      if (!disposed) release?.();
    });
    return () => {
      disposed = true;
      release?.();
    };
  }, []);
}
