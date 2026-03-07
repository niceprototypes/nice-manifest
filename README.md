# Nice Manifest

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
│   └── vite.md                    # nice-vite-watcher usage
└── publish/                       # RELEASING
    ├── README.md                  # Index
    ├── git.md                     # Commit format, branching
    └── npm.md                     # Version bumping, publish order, peer deps
```

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

---

## Mandatory Prerequisites

1. **Read all source files before editing.** No Claude instance may modify a nice-* package without first reading every source file in that package. Trace import chains from the entry point to verify which files the build actually uses. Duplicate or dead files exist — editing the wrong copy wastes time and produces silent failures.

---

## Update Rules

1. New pattern discovered → add to relevant file
2. Documentation contradicts code → fix documentation
3. New file needed → place in `read/` (understanding) or `edit/` (making) or `build/` (developing) or `publish/` (releasing)
4. Keep entries terse - tables and code blocks, not prose