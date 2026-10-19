# Agent workflow and ownership

Read [project context](../project-context.md) for the product and implementation requirements. This document defines how agent work is assigned and integrated.

## Coordination

The main agent owns the user conversation, authorization record, and final integration. It can perform `web-prod` directly or assign that role to the project agent. A child `web-prod` returns plans, findings, and assigned work to the parent; it cannot grant approval or take over the owner's decisions.

Start with one agent. Use specialist tasks only when a clear benefit warrants them and the host supports the assignment. Frontend, motion, and independent QA are logical roles, not mandatory additional agent files or always-running workers. When nested agents are unavailable, the parent dispatches siblings. If delegation is unavailable, work sequentially and label review as self-review.

## Responsibilities

| Role | Owns | Boundary |
| --- | --- | --- |
| Owner | Product decisions and approval of major scope changes or publication | Agent recommendations do not replace owner approval. |
| Main agent / coordinator | Scope, acceptance, file assignments, dependencies, integration, and final evidence | A child coordinator advises the main agent; one agent retains integration responsibility. |
| Frontend specialist | Assigned layout/components, content, themes, responsive behavior, semantics and focus | Preserve the reference; agree on shared DOM/state interfaces with motion before editing. |
| Motion specialist | Assigned loader/introduction state, timelines, readiness, playback and cleanup | Preserve the supplied sequence and fallbacks; coordinate shared component ownership. |
| QA reviewer | Assigned verification and evidence of regressions or acceptance | Report findings; do not silently edit product files or approve publication. |

The coordinator is accountable for integration quality, the assigned implementer performs the change, and QA supplies verification. The owner remains the approval authority for major product decisions and external release.

## Handoffs

For substantial work, include:

- Desired outcome and mode: audit, plan, implementation, or verification.
- Existing authorization and the relevant project requirements/reference states.
- Inspected writable paths, read-only dependencies, file owner, and dependency order.
- Shared DOM/state/event interfaces where frontend and motion meet.
- Observable acceptance checks and the evidence needed to assess them.

Return findings or changed files with source/state evidence, actual checks and outcomes, conflicts, remaining limitations, and the next needed action. Do not invent file paths, commands, capabilities, or test results. An assignment cannot expand the owner's authorization.

Assign one writer per file at a time. Sequence work on a shared component rather than overwriting another agent's changes. Integrate the first change, then assign the next. Unexpected changes or incompatible interfaces return to the coordinator for reconciliation.

## Skills

| Skill | Use | Result |
| --- | --- | --- |
| `ideas-organizer` | Ambiguous or substantial requests needing scope and dependencies | A proportionate brief or handoff; planning alone does not authorize implementation. |
| `design-taste-frontend` | Significant visual decisions or visual review | Judgments tied to this portfolio's reference and user outcome. |
| `redesign-existing-projects` | Existing interface audits or assigned refinements | Evidence-led findings, or authorized fixes with relevant checks. |

Use the existing skill names and repository-local paths. Do not load all skill references for a routine edit. Shared project rules belong in `AGENTS.md` and project context, not repeated across every skill.

## Validation and decisions

Review changes against the assignment, inspect relevant diffs, and run the checks appropriate to the actual project. QA reports defects, the assigned implementer fixes them, and the affected checks are repeated. Use [QA guidance](qa.md) and retain unresolved limitations.

For a material approved change, record the date, actual decision, scope, and supporting evidence in the relevant project document. Keep task-local details in the handoff/report unless they need to persist. Close with observed outcomes; do not claim independent review when only self-review occurred.

## Portability

The project requirements, Markdown workflow, and skill content are shared context. `.codex/agents/web-prod.toml` is the Codex adapter, not a universal agent schema. For another host, verify its installed version, project-instruction discovery, skill paths, tool names, and delegation support before adapting the role. Keep account/global settings and models unchanged unless that configuration work is assigned.

Antigravity/Gemini alternatives from the separate draft remain reference material until a specific host setup is requested. Confirm the exact OmniRoute product/version and intended routing role before configuring endpoints, providers, or executable skills. No such integration is configured by this preparation.
