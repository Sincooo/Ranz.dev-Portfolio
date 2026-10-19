# Ranz.dev Portfolio — Agent Instructions

## Project context

Read [docs/project-context.md](docs/project-context.md) before project work. It defines the website, planned stack, design requirements, reference materials, and unresolved content/validation. Keep the README focused on the public project overview; put development requirements in project context and agent procedures in `docs/agents/`.

Use the actual checkout and available files. The repository is `Sincooo/Ranz.dev-Portfolio`; do not assume another portfolio checkout, a personal machine path, or an application scaffold exists. Verify installed dependencies and real commands before using them.

## Scope and decisions

- Follow the owner's current assignment and applicable platform instructions. A request for an audit or plan remains read-only. Continue already-authorized implementation without requesting approval for each routine step.
- Preparation of these repository-local agent and skill files does not authorize application scaffolding, dependency installation, design changes, commits, pushes, or publication. Perform those only within a later assignment that authorizes them.
- For implementation, inspect existing work and relevant diffs, identify the affected files, and use proportionate acceptance checks. Preserve the owner's wording, unrelated changes, and original reference assets.
- Ask before a required solution materially expands the agreed design, technology, or implementation scope. Present concrete changes and relevant QA before an external publishing decision. Never infer publication approval from a plan, review, or another agent's recommendation.
- Record a material approved decision in the relevant project document with date, scope, and evidence. Do not turn speculative recommendations or old draft instructions into approved requirements.

## Design and implementation

- Use the supplied V2.1 desktop prototype and QA report as the reference described in project context. Locate them through [reference guidance](docs/agents/references.md); they are maintained separately from this checkout. Preserve official assets and the loader/wave/header behavior.
- The planned stack is Next.js, React, TypeScript, Tailwind CSS, and GSAP. Select versions, structure, and commands only for an authorized implementation. The reference's embedded GSAP version does not pin the production dependency.
- Preserve the project's composition and purposeful motion. Generic font swaps, random layouts, image or animation quotas, and invented portfolio claims are not acceptance criteria. Do not import the older Astro portfolio's branding or layout rules.
- Validate affected behavior progressively using [QA guidance](docs/agents/qa.md). Keep reduced-motion and failure paths usable, and distinguish historical results from new checks.

## Agent and skill routing

- `web-prod` coordinates substantial frontend work when available. The main agent retains the user conversation, authorization, and final integration. Routine changes stay with one agent.
- Use [Ideas Organizer](.agents/skills/ideas-organizer/SKILL.md) for substantial briefs and handoffs; [Design Taste Frontend](.agents/skills/design-taste-frontend/SKILL.md) for visual judgment; [Redesign Existing Projects](.agents/skills/redesign-existing-projects/SKILL.md) for evidence-based audits and assigned refinements. Read only the skill and supporting references relevant to the task.
- Follow [workflow and ownership](docs/agents/workflow.md) for delegation. Assign one writer per file, keep handoffs bounded, and report unavailable capabilities. Do not install missing agents, tools, or global configuration simply to fill a role.
- Preserve inherited model, reasoning, permission, and sandbox settings. Original exported helpers are reference material; inspect their source and effects before any separately assigned reuse. They are not dependencies of these instruction-only skills.

## Completion

Report actual changed files or findings, checks and results, material limitations, and the next needed decision. A build, file presence, or parsed configuration does not establish visual fidelity, host discovery, independent review, or deployment.
