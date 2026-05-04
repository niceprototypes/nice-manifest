# Nice Manifest

---

> **AI OPTIMIZATION NOTES:** 
> - This documentation prioritizes machine parsing over human readability
> - When updating, optimize for AI comprehension by using terse descriptions, avoid prose, prefer structured data
> - If told to "read manifest" with no further context, then read this entire project 

**This is a comprehensive living guide designed to give AI instances full context into the Nice ecosystem and its related projects and components.**

Every pattern, convention, and piece of logic that an AI assistant might need when working on nice-* packages should be documented here. If it's not in this documentation, an AI instance won't know it exists.

Context manifest for AI assistants working on Nice Prototypes ecosystem (`nice-*` packages at `~/Code/nice-*`).

---

## File Tree

```
nice-manifest/
├── README.md                      # THIS FILE - entry point, quick reference
├── discipline/                    # HIGHEST-PRIORITY behavioral rules — read first
│   ├── README.md                  # Index
│   ├── verification.md            # Verify before claiming; tag confidence
│   ├── disclosure.md              # Tag every factual claim by evidence source
│   └── refactor-safety.md         # Keep every intermediate save compiling during refactors
├── read/                          # UNDERSTANDING existing systems
│   ├── README.md                  # Index
│   ├── inheritance.md             # Package hierarchy, dependency graph, layers
│   ├── audit.md                   # Consistency audit, improvements, documentation gaps
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
│   ├── configuration.md           # Build config patterns, deviation audit
│   └── storybook.md               # Story file patterns
├── build/                         # LOCAL DEVELOPMENT
│   ├── README.md                  # Index
│   ├── symlinks.md                # file: references, nice-toolkit CLI commands
│   ├── vite.md                    # nice-vite-watcher usage
│   └── image-compressor.md        # nice-image-compressor CLI for PNG compression
└── publish/                       # RELEASING
    ├── README.md                  # Index
    ├── git.md                     # Commit format, ntk --commit workflow
    ├── bump-intent.md             # .nice/bump.md format, ✓ marker, --commit ↔ --publish relationship
    └── npm.md                     # Version bumping, publish order, peer deps
```

---

## Standard Bearers

Two packages are designated as the canonical reference implementations for the ecosystem. When auditing or comparing other packages, these are the controls — their patterns define correctness, and any deviation in other packages is a finding unless the package has a documented justified exception.

| Role | Package | Audit Target |
|------|---------|--------------|
| React component packages | **nice-react-typography** | All `nice-react-*` component packages (Button, Icon, Flex, Tile, Image, Slider, Lightbox, Input, Scroll, etc.) |
| Configuration / CLI / build-plugin packages | **nice-toolkit** | nice-configuration, nice-vite-watcher, and similar tooling packages |

When the standard bearer itself needs to change, that is a deliberate, separate decision — not something to fold into a normalization audit.

---

## Quick Reference

### Package Layers (deps flow down)

```
Application  →  nice-storybook, nice-website-2025
Feature      →  nice-react-button
Utility      →  nice-react-flex, nice-react-typography, nice-react-tile, nice-react-icon
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
"nice-styles": "file:../nice-styles"
```

### After Dependency Changes

```bash
ntk --clean-all
```

---

## Reading Order by Task

| Task | Read First |
|------|------------|
| New component package | `read/inheritance.md` → `edit/component.md` |
| New story | `edit/storybook.md` |
| Build config issue | `edit/configuration.md` |
| Linked package not updating | `build/symlinks.md` or `build/vite.md` |
| Committing work | `publish/git.md` → `publish/bump-intent.md` |
| Publishing | `publish/npm.md` |
| Understanding dependencies | `read/inheritance.md` |
| Token naming / CSS variables | `read/styles/tokens.md` |
| Audit / improve ecosystem | `read/audit.md` |
| Writing implementation logic | `edit/comments.md` |
| Compressing PNG assets | `build/image-compressor.md` |

---

## Mandatory Prerequisites

1. **Read all source files before editing.** No Claude instance may modify a nice-* package without first reading every source file in that package. Trace import chains from the entry point to verify which files the build actually uses. Duplicate or dead files exist — editing the wrong copy wastes time and produces silent failures.

---

## Alignment Principle

The `~/nice/*` packages are not independent projects that happen to live in adjacent folders. They are one cohesive system that publishes to npm under separate names for distribution reasons only. There is no implicit reason for any two packages to drift on shared tooling — TypeScript version, build config, lint rules, or shared library versions. Treat any divergence as a defect to fix, not a per-package choice.

**Rule:** Anything shared belongs in `nice-configuration` (or another foundation package). Every consuming package uses that resource at the same version. If one package needs to drift, the change is made in `nice-configuration` first and propagated to all consumers in the same operation.

**Currently in scope for alignment:**

| Resource | Source | Target | Status |
|----------|--------|--------|--------|
| TypeScript version | each package's `devDependencies` | `^6.0.0` (matches nice-configuration) | in-progress — pilot in react-lightbox first |
| TypeScript config | each package's `tsconfig.json` | `extends "nice-configuration/typescript/react"` | partial — see deviations in `edit/configuration.md` |
| Rollup config | each package's `rollup.config.js` | `nice-configuration/rollup → createConfiguration()` | partial — see deviations in `edit/configuration.md` |
| Jest config | each package's `jest.config.js` | `nice-configuration/jest/react` | partial — most packages missing |
| Lint config | each package's `.eslintrc.cjs` | TBD — currently inconsistent | not yet aligned |
| Prettier config | each package's `.prettierrc` | TBD — currently inconsistent | not yet aligned |

**Documented exceptions:**

- `website-2025` — CRA 5 pins TypeScript to 4.9.5 and provides its own build pipeline. Treat as out-of-band until CRA is replaced.
- Justified per-package deviations are listed in `edit/configuration.md → Justified Exceptions`. New deviations require an entry in that table.

**Decision principle:** before adding a new dev dep or config to one package, check whether it belongs in `nice-configuration`. If it does, add it there first.

---

## `.nice/` Folder Convention

Two artifact types exist today. Each has a fixed scope — do not mix them.

| Artifact | Scope | Path | Documented in |
|----------|-------|------|---------------|
| Session log | workspace-wide (one location) | `manifest/.nice/sessions/YYYY-MM-DD.md` | [`edit/session-log.md`](edit/session-log.md) |
| Bump intent | per-package | `{package}/.nice/bump.md` | [`publish/bump-intent.md`](publish/bump-intent.md) |

**Sessions:** every package's session entries for a given day go in the single dated file under `manifest/.nice/sessions/`. Source-package context is preserved inline in each entry's `**Claude (HH:MM, {package}):**` marker. Per-package `.nice/sessions/` folders must not be created.

**Bump intent:** each publishable package keeps its own `.nice/bump.md` because each package is independently versioned. Empty `bump.md` files are normal (placeholder until the next publishable change).

### What this convention does NOT cover

- One-off manual files (e.g. an ad-hoc audit a user asked Claude to write) may live under `manifest/.nice/` if they're workspace-relevant or under `{package}/.nice/` if scoped to one package. They are outside the two-artifact convention — Claude must not generalize from them or invent a third artifact category. Tooling and convention rules apply only to `sessions/` and `bump.md`.
- Older `claude.md/` folders or per-package `.nice/sessions/` folders are migration artifacts. If encountered, fold their contents into `manifest/.nice/sessions/` and delete the source.

---

## Update Rules

1. New pattern discovered → add to relevant file
2. Documentation contradicts code → fix documentation
3. New file needed → place in `read/` (understanding) or `edit/` (making) or `build/` (developing) or `publish/` (releasing)
4. Keep entries terse - tables and code blocks, not prose