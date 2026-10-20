/* Ranz.dev SVG + GSAP animation. No SVG plugins required. */
(() => {
  "use strict";

  // The supplied artwork is preserved exactly. Only the drawing mask is new.
  const ARTWORK = "M 104.065 80.344 L 164.665 80.344 C 180.426 80.344 193.104 91.501 193.104 107.17 C 193.104 122.984 181.931 134.795 162.491 134.834 L 202.439 178.108 L 179.767 178.108 C 177.896 178.108 176.684 177.318 175.265 175.342 L 121.644 117.544 L 162.438 117.544 C 169.604 117.544 173.356 113.697 173.356 107.368 C 173.356 101.242 168.503 96.889 162.438 96.889 L 125.881 96.889 C 120.326 96.889 116.69 94.326 113.054 90.374 Z";
  const DRAWING = "M104.065 80.344 L123 88.6 H163 C176 88.6 183.4 96.4 183.4 107.3 C183.4 119.5 175 126.2 162.4 126.2 H129 L190.5 173.5";
  const WORDMARK = window.RanzWordmark || [];
  const R_CENTER = { x: 153.252, y: 129.226 };
  let instanceCount = 0;

  function artworkSVG(id) {
    return `<svg viewBox="0 0 800 208" role="img" aria-labelledby="${id}-title ${id}-desc" xmlns="http://www.w3.org/2000/svg">
      <title id="${id}-title">Ranz.dev — monogram to wordmark</title>
      <desc id="${id}-desc">The R is drawn first, then moves into place as the remaining letters and code brackets complete the Ranz.dev wordmark. Silver light settles behind the finished lettering.</desc>
      <defs>
        <path id="${id}-shape" d="${ARTWORK}" fill-rule="evenodd"/>
        ${WORDMARK.filter(glyph => glyph.id !== "letter-r").map(glyph => `<path id="${id}-${glyph.id}" d="${glyph.d}" fill-rule="evenodd"/>`).join("")}
        <g id="${id}-wordmark"><use href="#${id}-shape"/>${WORDMARK.filter(glyph => glyph.id !== "letter-r").map(glyph => `<use href="#${id}-${glyph.id}"/>`).join("")}</g>
        <clipPath id="${id}-letters-clip"><rect data-wordmark-wipe x="196" y="60" width="0" height="130"/></clipPath>
        <clipPath id="${id}-clip"><use href="#${id}-shape"/></clipPath>
        <mask id="${id}-reveal" maskUnits="userSpaceOnUse" x="90" y="65" width="130" height="130" style="mask-type:luminance">
          <path data-draw d="${DRAWING}" fill="none" stroke="white" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
        </mask>
        <filter id="${id}-bloom" x="-90%" y="-90%" width="280%" height="280%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="7"/></filter>
        <filter id="${id}-near" x="-50%" y="-50%" width="200%" height="200%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="3.2"/></filter>
        <filter id="${id}-edge" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1.15"/></filter>
        <filter id="${id}-spark" x="-400%" y="-400%" width="900%" height="900%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="1.7"/></filter>
        <filter id="${id}-word-bloom" x="-10%" y="-80%" width="120%" height="260%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="6"/></filter>
      </defs>
      <g transform="translate(-2 -24)" aria-hidden="true">
        <use data-wordmark-bloom class="ranz-light-fill" href="#${id}-wordmark" filter="url(#${id}-word-bloom)" opacity="0"/>
        <g data-monogram>
        <use data-bloom class="ranz-light-fill" href="#${id}-shape" filter="url(#${id}-bloom)" opacity="0"/>
        <use data-near class="ranz-light-stroke" href="#${id}-shape" fill="none" stroke-width="1.4" filter="url(#${id}-near)" opacity="0"/>
        <g mask="url(#${id}-reveal)">
          <use data-core class="ranz-core" href="#${id}-shape"/>
          <path data-nib d="${DRAWING}" clip-path="url(#${id}-clip)" fill="none" stroke="white" stroke-width="30" stroke-linecap="round" opacity="0"/>
        </g>
        <use data-edge data-edge-soft class="ranz-light-stroke" href="#${id}-shape" fill="none" stroke-width="2.1" stroke-linecap="round" filter="url(#${id}-edge)" opacity="0"/>
        <use data-edge data-edge-sharp class="ranz-light-stroke" href="#${id}-shape" fill="none" stroke-width=".62" stroke-linecap="round" opacity="0"/>
        <g data-glint opacity="0">
          <circle r="2.2" class="ranz-light-fill" filter="url(#${id}-spark)" opacity=".8"/>
          <circle r=".72" fill="#ffffff"/>
        </g>
        </g>
        <use data-bracket class="ranz-core" href="#${id}-bracket-open" opacity="0"/>
        <g clip-path="url(#${id}-letters-clip)">
          ${WORDMARK.filter(glyph => !["letter-r", "bracket-open"].includes(glyph.id)).map(glyph => `<use data-glyph="${glyph.id}" class="ranz-core" href="#${id}-${glyph.id}" opacity="0"/>`).join("")}
        </g>
      </g>
    </svg>`;
  }

  class RanzLogoAnimation {
    constructor(root, options = {}) {
      if (!root) throw new Error("RanzLogoAnimation needs a container element.");
      if (!window.gsap) throw new Error("Load GSAP before animation.js.");
      if (WORDMARK.length !== 11) throw new Error("Load wordmark-data.js before animation.js.");
      this.root = root;
      this.options = {
        duration: 3.6,
        drawDuration: 1.45,
        traceDuration: 2.8,
        illuminationDuration: 1.6,
        composeDuration: 1,
        autoplay: true,
        onStateChange: () => {},
        ...options
      };
      if (!Number.isFinite(this.options.duration) || this.options.duration <= 0) {
        throw new RangeError("duration must be a positive number of seconds.");
      }
      this.id = `ranz-${++instanceCount}`;
      this.state = "ready";
      this.userPaused = false;
      this.playbackRequested = false;
      this.offscreen = false;
      this.destroyed = false;
      this.media = window.matchMedia("(prefers-reduced-motion: reduce)");
      root.classList.add("ranz-logo");
      this.originalMarkup = root.innerHTML;
      root.innerHTML = `<div class="ranz-backdrop" aria-hidden="true"></div>${artworkSVG(this.id)}`;
      this.svg = root.querySelector("svg");
      this.draw = root.querySelector("[data-draw]");
      this.nib = root.querySelector("[data-nib]");
      this.edges = [...root.querySelectorAll("[data-edge]")];
      this.glint = root.querySelector("[data-glint]");
      this.monogram = root.querySelector("[data-monogram]");
      this.glyphs = [...root.querySelectorAll("[data-glyph]")];
      this.bracket = root.querySelector("[data-bracket]");
      this.wordmarkWipe = root.querySelector("[data-wordmark-wipe]");
      this.wordmarkBloom = root.querySelector("[data-wordmark-bloom]");
      this.bloom = root.querySelector("[data-bloom]");
      this.near = root.querySelector("[data-near]");
      this.backdrop = root.querySelector(".ranz-backdrop");
      this.drawLength = this.draw.getTotalLength();
      this.shape = root.querySelector(`#${this.id}-shape`);
      this.outlineLength = this.shape.getTotalLength();
      this.lightTravel = { progress: 0 };
      this.composition = { progress: 0, wipe: 0 };
      this.renderComposition = () => {
        const remaining = 1 - this.composition.progress;
        const scale = 1 + (this.initialScale - 1) * remaining;
        const x = R_CENTER.x + (402 - R_CENTER.x) * remaining;
        const y = R_CENTER.y + (128 - R_CENTER.y) * remaining;
        this.monogram.setAttribute("transform", `translate(${x} ${y}) scale(${scale}) translate(${-R_CENTER.x} ${-R_CENTER.y})`);
        this.wordmarkWipe.setAttribute("width", String(570 * this.composition.wipe));
      };
      this.edgeTails = [this.outlineLength * .14, this.outlineLength * .055];
      this.renderGlint = () => {
        const distance = this.lightTravel.progress * this.outlineLength;
        const point = this.shape.getPointAtLength(distance);
        this.glint.setAttribute("transform", `translate(${point.x} ${point.y})`);
        this.edges.forEach((edge, i) => {
          edge.style.strokeDashoffset = String(this.edgeTails[i] - distance);
        });
      };
      this.build();
      this.onVisibility = () => this.syncVisibility();
      this.onMotionPreference = () => {
        const progress = this.timeline.progress();
        const completed = this.state === "complete" || progress >= 1;
        const wasPaused = this.userPaused;
        const shouldPlay = this.playbackRequested;
        this.build();
        // Preference changes update the rendering without overriding playback intent.
        this.timeline.progress(completed ? 1 : progress, true).pause();
        this.renderGlint();
        this.renderComposition();
        if (completed) {
          this.playbackRequested = false;
          this.setState("complete");
        } else if (shouldPlay && !wasPaused) {
          this.play();
        } else {
          this.playbackRequested = false;
          this.userPaused = wasPaused;
          this.setState(wasPaused ? "paused" : "ready");
        }
      };
      document.addEventListener("visibilitychange", this.onVisibility);
      this.media.addEventListener("change", this.onMotionPreference);
      this.onResize = () => {
        if (Math.abs(this.openingScale() - this.initialScale) > .005) this.onMotionPreference();
      };
      window.addEventListener?.("resize", this.onResize);
      this.observer = new IntersectionObserver(entries => {
        this.offscreen = !entries[0].isIntersecting;
        this.syncVisibility();
      });
      this.observer.observe(root);
      if (this.options.autoplay) this.play();
    }

    setState(value) {
      if (this.state === value) return;
      this.state = value;
      this.root.dataset.animationState = value;
      this.options.onStateChange(value, this);
    }

    openingScale() {
      // Measure before the component's presentation scale so the opening R scales with it.
      const width = this.root.clientWidth || this.root.getBoundingClientRect?.().width || 1200;
      const desiredSize = Math.min(308, (window.innerWidth || 1440) * .56, (window.innerHeight || 900) * .48);
      return desiredSize * 800 / (width * 98.374);
    }

    build() {
      if (this.timeline) this.timeline.kill();
      const g = window.gsap;
      const reduced = this.media.matches;
      const drawTime = reduced ? 0 : this.options.drawDuration;
      const traceStart = drawTime + .14;
      const composeStart = drawTime + .15;
      const wordmarkStart = composeStart + this.options.composeDuration * .82;
      const traceTime = this.options.traceDuration;
      const lightStart = Math.max(traceStart + traceTime * .64, wordmarkStart + .96);
      this.initialScale = this.openingScale();
      g.set(this.draw, { strokeDasharray: this.drawLength, strokeDashoffset: reduced ? 0 : this.drawLength, opacity: reduced ? 1 : 0, autoRound: false });
      g.set(this.nib, { strokeDasharray: `3 ${this.drawLength}`, strokeDashoffset: 3, opacity: 0 });
      this.edges.forEach((edge, i) => {
        g.set(edge, { strokeDasharray: `${this.edgeTails[i]} ${this.outlineLength}`, opacity: 0 });
      });
      g.set(this.lightTravel, { progress: 0 });
      g.set(this.glint, { opacity: 0 });
      g.set(this.composition, { progress: reduced ? 1 : 0, wipe: reduced ? 1 : 0 });
      g.set([...this.glyphs, this.bracket], { opacity: reduced ? 1 : 0 });
      g.set(this.wordmarkBloom, { opacity: 0 });
      this.renderComposition();
      this.renderGlint();
      g.set([this.bloom, this.near, this.backdrop], { opacity: 0 });
      g.set(this.svg, { scale: reduced ? 1 : .965, transformOrigin: "50% 50%" });
      g.set(this.backdrop, { scale: reduced ? 1 : .78, xPercent: 0, yPercent: 0, transformOrigin: "50% 50%" });
      this.timeline = g.timeline({
        paused: true,
        onComplete: () => {
          this.playbackRequested = false;
          this.setState("complete");
        }
      });
      const tl = this.timeline;
      tl.addLabel("draw", 0);
      if (reduced) {
        tl.to(this.bloom, { opacity: .22, duration: .35, ease: "power1.out" }, 0)
          .to(this.near, { opacity: .30, duration: .35, ease: "power1.out" }, 0)
          .to(this.wordmarkBloom, { opacity: .24, duration: .35, ease: "power1.out" }, 0)
          .to(this.backdrop, { opacity: .88, duration: .35, ease: "power1.out" }, 0);
      } else {
        tl.to(this.draw, { strokeDashoffset: 0, duration: drawTime, ease: "power3.out", autoRound: false }, 0)
          .to(this.draw, { opacity: 1, duration: .025, ease: "none" }, 0)
          .to(this.svg, { scale: 1, duration: drawTime, ease: "power3.out" }, 0)
          .to(this.nib, { strokeDashoffset: -this.drawLength, duration: drawTime, ease: "power3.out", autoRound: false }, 0)
          .to(this.nib, { opacity: .55, duration: .06 }, 0)
          .to(this.nib, { opacity: 0, duration: .24 }, drawTime - .24)
          .addLabel("compose", composeStart)
          .call(() => this.setState("composing"), null, composeStart)
          .to(this.composition, { progress: 1, duration: this.options.composeDuration, ease: "power3.inOut", onUpdate: this.renderComposition }, composeStart)
          .addLabel("wordmark", wordmarkStart)
          .call(() => this.setState("completing"), null, wordmarkStart)
          .to(this.composition, { wipe: 1, duration: .95, ease: "power2.out", onUpdate: this.renderComposition }, wordmarkStart)
          .to(this.glyphs, { opacity: 1, duration: .42, stagger: .055, ease: "power2.out" }, wordmarkStart + .04)
          .to(this.bracket, { opacity: 1, duration: .5, ease: "power2.out" }, wordmarkStart + .1)
          .addLabel("trace", traceStart)
          .call(() => this.setState("tracing"), null, traceStart)
          .to(this.lightTravel, { progress: 1, duration: traceTime, ease: "power1.inOut", onUpdate: this.renderGlint }, traceStart)
          .to(this.edges[0], { opacity: .72, duration: .28, ease: "power2.out" }, traceStart)
          .to(this.edges[1], { opacity: 1, duration: .2, ease: "power2.out" }, traceStart)
          .to(this.glint, { opacity: 1, duration: .2, ease: "power2.out" }, traceStart)
          .to(this.edges, { opacity: 0, duration: .72, ease: "sine.inOut" }, traceStart + traceTime - .72)
          .to(this.glint, { opacity: 0, duration: .5, ease: "sine.inOut" }, traceStart + traceTime - .5)
          .to(this.near, { opacity: .36, duration: 1.5, ease: "sine.inOut" }, traceStart + .18)
          .addLabel("illuminate", lightStart)
          .call(() => this.setState("illuminating"), null, lightStart)
          .to(this.bloom, { opacity: .34, duration: this.options.illuminationDuration * .55, ease: "power2.out" }, lightStart)
          .to(this.bloom, { opacity: .22, duration: this.options.illuminationDuration * .45, ease: "sine.inOut" }, lightStart + this.options.illuminationDuration * .55)
          .to(this.wordmarkBloom, { opacity: .24, duration: this.options.illuminationDuration, ease: "sine.inOut" }, lightStart)
          .to(this.backdrop, { opacity: 1, scale: 1.025, xPercent: 0, yPercent: 0, duration: this.options.illuminationDuration * .6, ease: "power2.out" }, lightStart)
          .to(this.backdrop, { opacity: .88, scale: 1, duration: this.options.illuminationDuration * .4, ease: "sine.inOut" }, lightStart + this.options.illuminationDuration * .6)
          .to(this.near, { opacity: .30, duration: this.options.illuminationDuration * .7, ease: "sine.inOut" }, lightStart + this.options.illuminationDuration * .3);
      }
      tl.addLabel("settled", tl.duration());
      // Retain every ease and overlap while fitting the complete intro to its runtime.
      if (!reduced) tl.timeScale(tl.duration() / this.options.duration);
    }

    play() {
      if (this.destroyed) return;
      this.userPaused = false;
      if (this.timeline.progress() >= 1) return;
      this.playbackRequested = true;
      this.setState(this.media.matches ? "illuminating" : this.phase());
      if (!document.hidden && !this.offscreen) this.timeline.play();
    }

    pause() {
      if (this.destroyed || this.state === "complete") return;
      this.userPaused = true;
      this.playbackRequested = false;
      this.timeline.pause();
      this.setState("paused");
    }

    replay() {
      if (this.destroyed) return;
      this.userPaused = false;
      this.build();
      this.setState("ready");
      this.play();
    }

    phase() {
      const t = this.timeline.time();
      if (t >= this.timeline.labels.illuminate) return "illuminating";
      if (t >= this.timeline.labels.wordmark) return "completing";
      if (t >= this.timeline.labels.compose) return "composing";
      if (t >= this.timeline.labels.trace) return "tracing";
      return "drawing";
    }

    syncVisibility() {
      if (this.destroyed || !this.playbackRequested || this.userPaused || this.state === "complete") return;
      if (document.hidden || this.offscreen) this.timeline.pause();
      else this.timeline.play();
    }

    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.timeline.kill();
      this.observer.disconnect();
      document.removeEventListener("visibilitychange", this.onVisibility);
      this.media.removeEventListener("change", this.onMotionPreference);
      window.removeEventListener?.("resize", this.onResize);
      this.root.innerHTML = this.originalMarkup;
      delete this.root.dataset.animationState;
    }
  }

  window.RanzLogoAnimation = RanzLogoAnimation;
})();
