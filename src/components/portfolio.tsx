"use client";

import Image from "next/image";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Portrait } from "./portrait";
import { usePortfolioMotion } from "./use-portfolio-motion";
import { SocialIcon, type SocialName, ThemeIcon } from "./portfolio-icons";

const socialNames: SocialName[] = ["GitHub", "LinkedIn", "Instagram", "Email"];
const introduction = "I learn by building, turning curiosity into things people can experience.";

export function Portfolio() {
  usePortfolioMotion();
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [menuOpen, setMenuOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const menuRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(message);
    feedbackTimer.current = setTimeout(() => setFeedback(""), 2800);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("theme-light", theme === "light");
    document.body.classList.toggle("theme-dark", theme === "dark");
    document
      .querySelectorAll<HTMLLinkElement>('link[rel~="icon"][href^="/favicons/"]')
      .forEach((link) => {
        const href = link.getAttribute("href");
        if (href) link.setAttribute("href", href.replace(/\/(dark|light)\//, "/" + theme + "/"));
      });
  }, [theme]);

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const trigger = menuToggleRef.current;
    document.body.classList.add("menu-open");
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenuOpen(false);
      }
      if (event.key !== "Tab") return;
      const controls = menuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex="0"]',
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.classList.remove("menu-open");
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  return (
    <>
      <a className="skip-link" href="#introduction" inert={menuOpen}>
        Skip to introduction
      </a>
      <header className="site-header" id="top" inert={menuOpen}>
        <span className="brand" role="img" aria-label="Ranz.dev">
          <span className="brand-size" aria-hidden="true">
            &lt;Ranz<span className="brand-dot">.</span>dev/&gt;
          </span>
          <Image className="brand-art brand-white" src="/brand/wordmark-white.svg"
            alt="" aria-hidden="true" width={800} height={208} unoptimized loading="eager" />
          <Image className="brand-art brand-black" src="/brand/wordmark-black.svg"
            alt="" aria-hidden="true" width={800} height={208} unoptimized loading="eager" />
        </span>
        <div className="header-right">
          <button
            className="theme-toggle"
            id="themeToggle"
            aria-label={"Switch to " + (theme === "dark" ? "light" : "dark") + " mode"}
            title="Toggle light and dark mode"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <ThemeIcon />
          </button>
          <button
            ref={menuToggleRef}
            id="menuToggle"
            className="menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="siteMenu"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <span>MENU</span>
            <span className="menu-bars" aria-hidden="true"><i /><i /></span>
          </button>
        </div>
      </header>

      <aside
        ref={menuRef}
        className={"side-menu" + (menuOpen ? " open" : "")}
        id="siteMenu"
        role="dialog"
        aria-label="Site menu"
        aria-modal={menuOpen || undefined}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="menu-heading">
          <span>INDEX / 01—02</span>
          <button ref={closeRef} className="menu-close" id="menuClose"
            aria-label="Close menu" onClick={() => setMenuOpen(false)}>×</button>
        </div>
        <nav aria-label="Portfolio sections">
          <a href="#home" onClick={() => setMenuOpen(false)}><span>01</span>Home</a>
          <a href="#introduction" onClick={() => setMenuOpen(false)}><span>02</span>Introduction</a>
        </nav>
        <p>Remaining portfolio sections are intentionally outside this first design pilot.</p>
      </aside>
      <button id="menuBackdrop" className={"menu-backdrop" + (menuOpen ? " visible" : "")}
        aria-label="Close menu backdrop" tabIndex={-1} aria-hidden={!menuOpen}
        inert={!menuOpen} onClick={() => setMenuOpen(false)} />

      <main inert={menuOpen}>
        <div className="scene-track" id="sceneTrack">
          <div className="scene-stage" id="sceneStage">
        <section className="hero" id="home" aria-labelledby="heroTitle">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-content">
            <div className="hero-left">
              <div className="metadata">
                <div className="socials" aria-label="Social links awaiting profile URLs">
                  {socialNames.map((name) => (
                    <a key={name} href="#" data-link-pending={name}
                      aria-label={name + (name === "Email" ? " address pending" : " URL pending")}
                      title={name + (name === "Email" ? " address pending" : " link pending")}
                      onClick={(event) => {
                        event.preventDefault();
                        notify(name + " profile link will be added when provided.");
                      }}
                    ><SocialIcon name={name} /></a>
                  ))}
                </div>
                <div className="location">CAVITE <span className="location-dot">·</span> PHILIPPINES</div>
              </div>
              <h1 id="heroTitle"><span>EDWARD <b>RANZ</b></span><span>CARDOZA</span></h1>
              <div className="hero-bottom-copy">
                <p className="hero-role">Computer Science Student</p>
                <p className="hero-statement">Transforming ideas into interactive digital experiences through code and design.</p>
              </div>
            </div>
            <Portrait onFeedback={notify} />
          </div>
          <div className="hero-footer">
            <a href="#introduction" className="scroll-cue">
              <span className="scroll-circle" aria-hidden="true">↓</span>
              <span>SCROLL TO EXPLORE</span>
            </a>
          </div>
        </section>

        <section className="intro" id="introduction" aria-labelledby="introHeading">
          <div className="intro-content">
            <div className="intro-top">
              <span><span className="little-star" aria-hidden="true">✳</span> 02 / INTRODUCTION</span>
              <span>A LITTLE ABOUT ME</span>
            </div>
            <h2 id="introHeading" className="intro-statement" aria-label={introduction}>
              {introduction.split(" ").map((word, index) => (
                <Fragment key={index}>
                  {index > 0 ? " " : null}<span className="intro-word" aria-hidden="true">{[...word].map((letter, letterIndex) => (
                    <span className="intro-letter" key={letterIndex}>{letter}</span>
                  ))}</span>
                </Fragment>
              ))}
            </h2>
            <div className="intro-bottom">
              <span>AN ONGOING STORY IN CODE AND DESIGN</span>
              <span className="intro-progress" aria-hidden="true">
                <span className="intro-progress-line"><span className="progress-fill" id="progressFill" /></span>
                <span id="progressNumber">100%</span>
              </span>
            </div>
          </div>
        </section>
            <svg id="waveOverlay" className="wave-overlay" viewBox="0 0 1000 1000"
              preserveAspectRatio="none" aria-hidden="true">
              <path id="wavePath" d="M0 1400 L1000 1400 L1000 2600 L0 2600Z" />
            </svg>
          </div>
        </div>
      </main>
      <div className={"prototype-note" + (feedback ? " visible" : "")}
        id="prototypeNote" role="status" aria-live="polite" aria-atomic="true">{feedback}</div>
    </>
  );
}
