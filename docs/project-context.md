# Ranz.dev Portfolio — Project Context

Updated: 2026-10-20.

## Project overview

Ranz.dev is a personal portfolio website introducing Edward Ranz Cardoza and showcasing his work, skills, and background.

- Repository: [Sincooo/Ranz.dev-Portfolio](https://github.com/Sincooo/Ranz.dev-Portfolio).
- Audience: portfolio visitors and developers exploring the project.
- Core website sections: a landing page and personal introduction.
- Planned experience: light and dark themes, an animated brand introduction, and scroll-driven transitions.
- Access: through a web browser, with no installation required for visitors. The site is not yet deployed, and no public website URL is available.

The README provides a brief public overview. This document provides the supporting development context.

## Technology and implementation

The planned production stack is Next.js, React, TypeScript, Tailwind CSS, and GSAP. These technologies have not yet been installed or configured in the application repository.

The repository contains documentation and text-formatting conventions. Application scaffolding, dependency versions, package manager, application structure, scripts, CI, and deployment configuration remain undefined. No production build is available to validate.

No project license has been selected. Licenses bundled with reference assets or third-party tools do not establish a license for the portfolio.

## Design and interaction requirements

Use the supplied reference prototype and accompanying QA report to guide implementation. Preserve its composition, typography, spacing, existing interactions, official Ranz.dev wordmarks and favicons, charcoal wave, and continuous loader-to-content motion.

- Loader: the reference uses the supplied GSAP 3.13.0 source, a 3.6-second logical sequence at 80% presentation scale, and a `#0d0e0d` backdrop. This reference version does not select the production dependency version.
- Reveal: preserve the completed mark, a residual-glow fade of at least 0.25 seconds, a readiness hold of at least 0.3 seconds, complete wave coverage before the upward reveal, and permanent loader removal afterward.
- Wave colors: `#3C403D` in dark mode and `#b8bcb6` in light mode.
- Motion fallback: retain the static reduced-motion presentation and gentle 0.4-second dissolve.
- Playback: retain completed same-tab refresh behavior, fresh-tab playback, visibility handling, and recovery from missing or stalled animation.
- Header wordmark: keep it absolute, nonsticky, nonclickable, and stationary during its 200-millisecond glow response.

## Reference materials

The supplied prototype, official assets, QA report, original agent export, and draft agent package are maintained separately from the application repository. Verify their locations before using them; do not assume their folders exist in the checkout.

Preserve original reference materials and use the supplied brand assets. Repository-local agent instructions and skills are prepared for review under `AGENTS.md`, `.codex/agents/`, and `.agents/skills/`. The full original draft remains a separate reference.

## Remaining content and validation

The portrait and social destinations still need confirmed content. Mobile layouts and browser/device acceptance criteria also remain unresolved.

Reference QA has documented limitations for native tab visibility, visible browser favicons, Safari/iOS touch icons, native duplicate-tab behavior, Firefox/WebKit, physical devices, and native toolbar zoom. Validate these behaviors in the production implementation; desktop reference coverage does not establish mobile acceptance.
