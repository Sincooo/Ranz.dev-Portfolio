# Motion review and production translation

Use `docs/project-context.md`, the supplied prototype and its QA report for timing, colors, state transitions, storage behavior and fallbacks. This reference adds implementation judgment without maintaining another copy of those values.

## Choreography

Explain each animation's purpose: orienting the viewer, connecting states, revealing content, or giving interaction feedback. Compare the combined sequence, not a collection of unrelated effects. Ian Vergara informs layout and Iqmal informs motion through the owner's supplied references; do not guess either site's measurements or add effect quotas.

The loader must finish the official mark, fade residual glow, hold for readiness, obtain full SVG coverage, reveal upward, and remove itself. The introduction preserves its reveal-once behavior. Test the intermediate states explicitly: a final hero screenshot cannot show whether early exposure occurred.

## Ownership and lifecycle

- Establish one owner for each timeline, event listener, observer, storage decision, and cleanup operation. Coordinate any shared DOM/state interface before frontend and motion work touch the same component.
- In React/Next.js, use browser APIs only in an appropriate client lifecycle. Keep static content accessible and avoid hydration-dependent hiding that can strand the page if initialization fails.
- Scope GSAP work to its component/targets. Dispose timelines, listeners, observers, and scheduled work on unmount or replacement. Verify repeated mount/navigation behavior when relevant; a first-load success cannot prove cleanup.
- Preserve the official animation sequence. A production dependency change must have explicit scope and parity evidence; do not silently substitute another motion library.
- Favor performant properties where they deliver the required effect, but measure the approved SVG wave rather than banning it categorically. Do not add smooth-scroll hijacking or a custom cursor as an automatic enhancement.
- Treat reduced-motion, denied storage, missing/stalled animation, and hidden-page behavior as first-class states. Preserve useful content when motion cannot run.

## Evidence

Use state-aware waits and bounded failure handling. Check fresh play and completed refresh separately. Record whether visibility/duplicate-tab evidence used native browser actions or a simulation. Include runtime and console errors in the result. Check both themes for the wave and wordmark handoff.

Use the progressive matrix in `docs/agents/qa.md`. Avoid claiming native events, physical-device performance, smooth continuous scrolling, or full accessibility from synthetic DOM probes alone.
