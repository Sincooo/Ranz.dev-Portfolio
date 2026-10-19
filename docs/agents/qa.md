# Agent verification guidance

Use [project context](../project-context.md), the supplied prototype, and its QA report to establish the expected behavior. Match verification to the assigned change. Historical prototype results are evidence about that artifact, not fresh production test results.

## Progressive checks

| Change | Verification |
| --- | --- |
| Agent instructions or documentation | Parse supported formats, resolve file references, inspect routing/scope consistency, and check actual host discovery when available. An application build is unnecessary for instruction-only changes. |
| First application slice | Verify the actual dependency choices, project scripts, and relevant type/lint/build checks. Do not guess commands from the old Astro project or a nonexistent scaffold. |
| Visible frontend behavior | Compare matched reference/current viewports, themes, content and loaded states. Check relevant keyboard/focus/navigation, overflow, clipping and semantics. |
| Loader/introduction motion | Inspect intermediate states, timing, full coverage, readiness, cleanup, reduced motion and affected failure/playback cases. A final hero screenshot cannot prove a correct transition. |
| Integrated implementation | Verify shared-state behavior, navigation/remount cleanup, both themes and relevant narrow/short viewports. |
| Release candidate | Check confirmed content, the agreed browser/device matrix, actual output/destination and remaining limitations before the owner's publication decision. |

For a result, record artifact/change identity, date, environment/browser version, viewport/theme/motion/state, action, expected and observed behavior, outcome, and useful evidence. Distinguish `PASS`, `FAIL`, `NOT RUN`, and `LIMITED`.

## Motion and interaction

Capture the opening animation, complete mark/glow fade, readiness hold, full wave coverage, upward reveal, loader removal, and introduction behavior when those states are affected. Use state-aware waits and a bounded timeout. An arbitrary two-second wait may capture the 3.6-second logical sequence before completion.

Verify fresh playback separately from completed same-tab refresh. Preserve denied-storage recovery, visibility pause/resume, static reduced-motion fallback, and missing/stalled-animation recovery. The reference's readiness escape is 15 foreground seconds. Record whether visibility or duplicate-tab behavior used native browser actions or a simulation.

Use actual keyboard and pointer interactions for menu focus, Escape/focus return, theme switching and relevant navigation. Synthetic scroll jumps or screenshots alone cannot establish smooth continuous motion or accessible interaction. Record runtime exceptions and console errors separately from visual findings.

## Remaining evidence

Keep the limitations recorded in project context open until suitable new evidence addresses them:

- Native hidden/visible tab behavior and native Duplicate-tab handling, including frozen/discarded owner limitations.
- Visible dark/light/dark browser favicons and relevant Safari/iOS touch-icon behavior.
- Firefox/WebKit, physical devices, native toolbar zoom, and the agreed responsive acceptance matrix.
- Confirmed portrait and social destinations.
- Production application/build/release checks once an implementation exists.

Source inspection can identify a risk but does not reproduce a browser defect. Do not report emulation as a physical-device test or remove a caveat just because its code path appears correct. Desktop reference approval does not establish mobile acceptance.

Generic image/motion counts or house-style scores are not portfolio acceptance criteria. Do not suppress a real defect to satisfy a taste lint tool. Review exported helper source, filesystem/network effects and relevance before any separately assigned use.
