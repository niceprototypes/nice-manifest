# Nice Manifest

---

## READ-ALL DIRECTIVE (for AI instances)

**When the user says any of the following, it means "read EVERY file listed in the Read Manifest below, in the order given, without asking for clarification":**

- "read nice-manifest"
- "read the manifest"
- "read manifest"
- "read"
- "load the manifest"
- "review the manifest"
- any other instruction that refers to nice-manifest without naming specific files

**Do NOT ask "read what?" or "which files?". The answer is always: all of them.**

Only narrow the scope if the user explicitly names specific files or subdirectories (e.g., "read edit/component.md only", "read just the publish folder").

### Read Manifest (read these files, in this order)

1. `README.md` (this file — you are here)
2. `read/README.md`
3. `read/inheritance.md`
4. `read/audit.md`
5. `read/projects/README.md`
6. `read/projects/storybook.md`
7. `read/projects/website.md`
8. `read/styles/tokens.md`
9. `edit/README.md`
10. `edit/comments.md`
11. `edit/component.md`
12. `edit/configuration.md`
13. `edit/session-log.md`
14. `edit/storybook.md`
15. `build/README.md`
16. `build/symlinks.md`
17. `build/vite.md`
18. `build/image-compressor.md`
19. `publish/README.md`
20. `publish/git.md`
21. `publish/npm.md`
22. `publish/bump-intent.md`

Paths are relative to `~/Code/nice-manifest/`. If a new file is added to the manifest, it MUST be appended to this list in the same commit.

---

> **AI OPTIMIZATION NOTE:** This documentation prioritizes machine parsing over human readability. When updating, optimize for AI comprehension - use terse descriptions, avoid prose, prefer structured data.

**This is a comprehensive living guide designed to give AI instances full context into the Nice ecosystem and its related projects and components.**

Every pattern, convention, and piece of logic that an AI assistant might need when working on nice-* packages should be documented here. If it's not in this documentation, an AI instance won't know it exists.

Context manifest for AI assistants working on Nice Prototypes ecosystem (`nice-*` packages at `~/Code/nice-*`).

---

## File Tree

```
nice-manifest/
├── README.md                      # THIS FILE - entry point, quick reference
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
│   ├── symlinks.md                # file: references, nice-npm-link commands
│   ├── vite.md                    # nice-vite-watcher usage
│   └── image-compressor.md        # nice-image-compressor CLI for PNG compression
└── publish/                       # RELEASING
    ├── README.md                  # Index
    ├── git.md                     # Commit format, branching
    └── npm.md                     # Version bumping, publish order, peer deps
```

---

## Standard Bearers

Two packages are designated as the canonical reference implementations for the ecosystem. When auditing or comparing other packages, these are the controls — their patterns define correctness, and any deviation in other packages is a finding unless the package has a documented justified exception.

| Role | Package | Audit Target |
|------|---------|--------------|
| React component packages | **nice-react-typography** | All `nice-react-*` component packages (Button, Icon, Flex, Tile, Image, Slider, Lightbox, Input, Scroll, etc.) |
| Configuration / CLI / build-plugin packages | **nice-npm-link** | nice-configuration, nice-vite-watcher, and similar tooling packages |

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
nnl --clean-all
```

---

## Reading Order by Task

| Task | Read First |
|------|------------|
| New component package | `read/inheritance.md` → `edit/component.md` |
| New story | `edit/storybook.md` |
| Build config issue | `edit/configuration.md` |
| Linked package not updating | `build/symlinks.md` or `build/vite.md` |
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

## Update Rules

1. New pattern discovered → add to relevant file
2. Documentation contradicts code → fix documentation
3. New file needed → place in `read/` (understanding) or `edit/` (making) or `build/` (developing) or `publish/` (releasing)
4. Keep entries terse - tables and code blocks, not prose