# Nice Manifest

---

> **AI OPTIMIZATION NOTES:** 
> - This documentation prioritizes machine parsing over human readability
> - When updating, optimize for AI comprehension by using terse descriptions, avoid prose, prefer structured data
> - "Read the manifest" loads the always-on **Core**, then lazy-loads topics on demand — see "Manifest Load Model" below. It does *not* mean read all 40+ files.

**This is a comprehensive living guide designed to give AI instances full context into the Nice ecosystem and its related projects and components.**

Every pattern, convention, and piece of logic that an AI assistant might need when working on nice-* packages should be documented here. If it's not in this documentation, an AI instance won't know it exists.

Context manifest for AI assistants working on the Nice Prototypes ecosystem — a set of independently versioned `nice-*` repositories, each published to npm on its own and cloned alongside each other for local development.

---

## File Tree

```
nice-manifest/
├── README.md                      # THIS FILE - entry point, quick reference
├── discipline/                    # HIGHEST-PRIORITY behavioral rules — read first
│   ├── README.md                  # Index
│   ├── responsiveness.md          # Never go unresponsive; no foreground subagents; match effort to task size
│   ├── grounding.md               # Never present a guess as fact: verify before claiming, tag evidence, never invent typed values; a causal chain is tagged separately from the facts under it, and static reading cannot establish a cause
│   ├── refactor-safety.md         # Keep every intermediate save compiling during refactors
│   ├── offboarding.md             # Reconcile manifest↔project discrepancies your change opened, before finishing
│   ├── scope.md                   # Do exactly what was asked — no unrequested rewrites/abstractions/extra files
│   ├── communication.md           # No sycophancy/lecturing/unsolicited caveats; announce long or hanging ops
│   └── stale-first.md             # Diagnosis order, all 10 steps: stale state → input arrives? → own diff → call site → file → package → foundation (gated). Gate A: cross-file diagnoses need a runtime observation. Gate B: an unexplained anomaly stops you
├── read/                          # UNDERSTANDING existing systems
│   ├── README.md                  # Index
│   ├── inheritance.md             # Package hierarchy, dependency graph, layers
│   ├── audit.md                   # Audits: architecture (manifest+stories) & full (+consumers); triggers + scope
│   ├── projects/
│   │   ├── README.md              # Index
│   │   ├── storybook.md           # nice-storybook structure
│   │   └── website.md             # nice-website-2025 structure
│   └── styles/
│       └── tokens.md              # Token naming conventions
├── edit/                          # EDITING new assets
│   ├── README.md                  # Index
│   ├── comments.md                # Inline code comment standards for AI readability
│   ├── component.md               # Component package structure, types, tokens
│   ├── generators.md              # Generators & emitters: pipeline, structure, docs standard, node:test snapshots
│   └── storybook.md               # Story file patterns
├── build/                         # LOCAL DEVELOPMENT
│   ├── README.md                  # Index
│   ├── symlinks.md                # file: references, nice-toolkit CLI commands
│   ├── vite.md                    # nice-vite-watcher usage
│   └── image-compressor.md        # nice-image-compressor CLI for PNG compression
├── publish/                       # RELEASING
│   ├── README.md                  # Index
│   ├── git.md                     # Commit format, nicely --commit workflow
│   ├── bump-intent.md             # .nice/bump.md format, ✓ marker, --commit ↔ --publish relationship
│   └── npm.md                     # Version bumping, publish order, peer deps
└── topics/                        # SINGLE-HOME reference topics (lazy-loaded; #8 in progress)
    └── build-config.md            # Config packages, standards, deviation audit (was edit/configuration.md)
```

---

## Manifest Load Model

"Read the manifest" does **not** mean read all 40+ files. It means **load the always-on Core, then lazy-load topic files on demand.** The Core carries *awareness* of everything; topic bodies are fetched only when the task touches them.

### Core — always loaded
- **`discipline/`** — every behavioral rule (grounding, scope, communication, stale-first, refactor-safety, responsiveness, offboarding). Applied to all work, always.
- **This `README.md`** — the discovery index: the File Tree (every file + one-line purpose), "Reading Order by Task", "Package Layers", and the "Config Surfaces" catalog below.

### Topics — loaded on demand
The `read/`, `edit/`, `build/`, `publish/` files. You are *aware* they exist from the File Tree; load a body only when the task or the Reading-Order table points to it. Do not front-load them.

### Why a discovery index, not a subset
An agent cannot load a topic it does not know exists, and must not depend on the user naming it. The File Tree and the catalogs list the **name + trigger** of every topic and reference surface, so the right doc is always discoverable from the Core — including surfaces the user never mentions.

### Config Surfaces — so config issues are always discoverable
When a build/config-related package misbehaves, a config doc exists; you do not need to be told:

| Surface | Where it lives | Read |
|---------|----------------|------|
| Shared build config | `nice-configuration` → `typescript/`, `rollup/`, `jest/` subpaths (lint/prettier pending alignment) | `topics/build-config.md` |
| Per-package config files | each package's `tsconfig.json`, `rollup.config.js`, `jest.config.js`, `.eslintrc`, `.prettierrc` | `topics/build-config.md`; `README.md` → Alignment Principle |
| Vite / dev server / watcher | `nice-vite-watcher`; storybook `.storybook/main.ts` | `build/vite.md`, `build/symlinks.md` |
| Cache / singleton / build triad | `nicely --clean` / `--dedupe` / `--build-all` | `build/symlinks.md`, `discipline/stale-first.md` |

---

## Standard Bearers

Two packages are designated as the canonical reference implementations for the ecosystem. When auditing or comparing other packages, these are the controls — their patterns define correctness, and any deviation in other packages is a finding unless the package has a documented justified exception.

| Role | Package | Audit Target |
|------|---------|--------------|
| React component packages | **nice-react-ink** | All `nice-react-*` component packages (Button, Icon, Flex, Tile, Image, Slider, Lightbox, Input, Scroll, etc.) |
| Configuration / CLI / build-plugin packages | **nice-toolkit** | nice-configuration, nice-vite-watcher, and similar tooling packages |

When the standard bearer itself needs to change, that is a deliberate, separate decision — not something to fold into a normalization audit.

### The token system is the origin pattern

The token generation system in **nice-styles** (token JSON → generated data, types, and CSS → runtime getters/setters, re-exported through nice-react-styles) is where the ecosystem's pattern starts. Every other package — including the standard bearers above — builds on it: component styling, theming, breakpoints, and configuration derive from token system logic rather than re-implementing it.

A package that cannot reach logic it needs through the token system is a **showstopper**, not a workaround opportunity. Examples: a component that has to hardcode a color, duration, or z-index because no token exists; a component that cannot resolve a theme or breakpoint value through a getter; a consumer that has to read raw generated data because no API exposes it. In those cases stop, report the gap, and fix it in the token system first — then build the package on top of the fix.

---

## Quick Reference

### Package Layers (deps flow down)

```
Application  →  nice-storybook, nice-website-2025
Feature      →  nice-react-button
Utility      →  nice-react-flex, nice-react-ink, nice-react-tile, nice-react-icon
Context      →  nice-react-styles
Foundation   →  nice-styles, nice-icons, nice-configuration
```

### Export Rules

| Type | Export |
|------|--------|
| React components | `default` |
| Types namespace | `default` |
| Everything else | named |

### Type Naming

```
{Component}{PropName}Type
```

### Local Dependencies

```json
"nice-styles": "file:../styles"
```

### Workspace operations

Three non-overlapping `nicely` commands cover the workspace-level concerns:

```bash
nicely --clean           # kill dev-server ports + wipe consumer build-tool caches
nicely --dedupe          # remove duplicate singletons from linked packages
nicely --build-all       # rebuild every linked package's dist in tier order
```

After dependency changes, run `nicely --dedupe`. After source changes that consumers don't see, `nicely --clean`. After a foundation refactor or on a fresh clone, `nicely --build-all`. Full topology and recipes in `build/symlinks.md` and `.nice/reports/caches.md`.

For a change scoped to one foundation package, `nicely --build-icons` rebuilds just `nice-icons` and its dependents (`nice-react-icon`, `nice-react-icon-vendor`, `nice-react-button`) in tier order — the targeted build after editing an SVG, avoiding a full `--build-all`.

---

## Reading Order by Task

| Task | Read First |
|------|------------|
| New component package | `read/inheritance.md` → `edit/component.md` |
| New story | `edit/storybook.md` |
| Build config issue | `topics/build-config.md` |
| Linked package not updating | `build/symlinks.md` or `build/vite.md` |
| Committing work | `publish/git.md` → `publish/bump-intent.md` |
| Finishing a unit of work | `discipline/offboarding.md` |
| Publishing | `publish/npm.md` |
| Understanding dependencies | `read/inheritance.md` |
| Token naming / CSS variables | `read/styles/tokens.md` |
| Audit / improve ecosystem | `read/audit.md` |
| Writing implementation logic | `edit/comments.md` |
| Writing or restructuring a generator / emitter | `edit/generators.md` → `edit/comments.md` |
| Compressing PNG assets | `build/image-compressor.md` |

---

## Mandatory Prerequisites

1. **Read all source files before editing.** No Claude instance may modify a nice-* package without first reading every source file in that package. Trace import chains from the entry point to verify which files the build actually uses. Duplicate or dead files exist — editing the wrong copy wastes time and produces silent failures.

   **Scope of this rule:** it licenses reading *the package you are editing*, and it is a floor on preparation — not a warrant for unbounded search. It does **not** authorize reading outward across packages to build a theory. Which package you are entitled to edit is decided by `discipline/stale-first.md` (check order + Gate A), before this rule applies. Reading is not free: a wrong diagnosis assembled from correctly-read files is the most expensive failure in this workspace's history, and it always begins as diligent reading.

2. **Diagnose before you read.** For a "why isn't X working" question, the first move is confirming X receives its input — not reading how X works. See `discipline/stale-first.md` step 5. "Read the source" is step 5 of 10, not the opening move.

---

## Alignment Principle

Every `nice-*` package is its own repository — independently versioned, independently published, and consumable on its own. There is no monorepo and no single codebase; a package reaches its foundations through npm exactly as any outside consumer would. Independence is the design, not an accident of folder layout.

That independence is structural. Consistency is deliberate, and has to be maintained rather than inherited: there is no implicit reason for any two packages to drift on shared tooling — TypeScript version, build config, lint rules, or shared library versions — so treat divergence as a defect to fix, not a per-package choice.

**Rule:** Anything shared belongs in `nice-configuration` (or another foundation package). Every consuming package uses that resource at the same version. If one package needs to drift, the change is made in `nice-configuration` first and propagated to all consumers in the same operation.

**Currently in scope for alignment:**

| Resource | Source | Target | Status |
|----------|--------|--------|--------|
| TypeScript version | each package's `devDependencies` | `^6.0.0` (matches nice-configuration) | in-progress — pilot in react-lightbox first |
| TypeScript config | each package's `tsconfig.json` | `extends "nice-configuration/typescript/react"` | partial — see deviations in `topics/build-config.md` |
| Rollup config | each package's `rollup.config.js` | `nice-configuration/rollup → createConfiguration()` | partial — see deviations in `topics/build-config.md` |
| Jest config | each package's `jest.config.js` | `nice-configuration/jest/react` | partial — most packages missing |
| Lint config | each package's `.eslintrc.cjs` | TBD — currently inconsistent | not yet aligned |
| Prettier config | each package's `.prettierrc` | TBD — currently inconsistent | not yet aligned |

**Documented exceptions:**

- `website-2025` — CRA 5 pins TypeScript to 4.9.5 and provides its own build pipeline. Treat as out-of-band until CRA is replaced.
- Justified per-package deviations are listed in `topics/build-config.md → Justified Exceptions`. New deviations require an entry in that table.

**Decision principle:** before adding a new dev dep or config to one package, check whether it belongs in `nice-configuration`. If it does, add it there first.

---

## Artifact Convention

Two artifact types exist today. Each has a fixed scope — do not mix them.

| Artifact | Scope | Path | Documented in |
|----------|-------|------|---------------|
| Bump intent + change record | per-package | `{package}/.nice/bump.md` | [`publish/bump-intent.md`](publish/bump-intent.md) |
| Report | workspace-wide (one location) | `manifest/.reports/{category}/{slug}.md` | this section |

**Bump intent (replaces session logs):** each publishable package keeps its own `.nice/bump.md`. It is both the version-bump intent for `nicely --publish` and the durable per-change record that the old `manifest/.nice/sessions/` logs used to hold — one timestamped entry per publishable change, written in the same commit. The separate per-day session-log convention is retired; see [`edit/session-log.md`](edit/session-log.md) for what moved and for the surviving mistake-reporting format. Empty `bump.md` files are normal (placeholder until the next publishable change).

**Reports:** ad-hoc audits, analyses, or recommendation documents the user asks Claude to produce live as standalone files under `manifest/.reports/{category}/` (`research/`, `audit/`, …). One file per report, kebab-case slug (`third-party-libraries.md`, `rimraf-adoption.md`). Reports are workspace-wide — package-scoped findings still belong here, with the package named in the body. Do not create a `reports/` folder under any individual package's `.nice/`.

**Trigger phrases → destination (fixed, do not ask):**

| User says | Write to |
|-----------|----------|
| "audit report", "audit the …", "write up an audit" | `manifest/.reports/audit/{slug}.md` |
| "research report", "research …", "look into … and write it up" | `manifest/.reports/research/{slug}.md` |

When the user asks for an **audit report**, the file goes in `manifest/.reports/audit/`. When the user asks for a **research report**, it goes in `manifest/.reports/research/`. Do not place these at the manifest root, under a package `.nice/`, or in a `manifest/reports/` folder (no such folder — the directory is dot-prefixed `.reports`). Pick the `{slug}` from the topic, kebab-case.

### What this convention does NOT cover

- Reports are not change-record entries. A report is a single durable document on a topic; a `bump.md` entry is a one-line record of a shipped change. If the user asks for an audit, write a report. If a change is publishable, append a `bump.md` entry. Do not duplicate the same content across both.
- Older `claude.md/` folders, any `.nice/sessions/` folder, and the former `manifest/.nice/reports/` location are migration artifacts. If encountered, fold session content into the relevant package's `.nice/bump.md`, move reports into `manifest/.reports/{category}/`, and delete the source.

---

## Update Rules

1. New pattern discovered → add to relevant file
2. Documentation contradicts code → fix documentation
3. New file needed → place in `read/` (understanding) or `edit/` (making) or `build/` (developing) or `publish/` (releasing)
4. Keep entries terse - tables and code blocks, not prose