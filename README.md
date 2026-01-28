# Nice Architecture

> **AI OPTIMIZATION NOTE:** This documentation prioritizes machine parsing over human readability. When updating, optimize for AI comprehension - use terse descriptions, avoid prose, prefer structured data.

Context manifest for AI assistants working on Nice Prototypes ecosystem (`nice-*` packages at `~/Code/nice-*`).

---

## File Tree

```
nice-architecture/
├── README.md                      # THIS FILE - entry point, quick reference
├── read/                          # UNDERSTANDING existing systems
│   ├── README.md                  # Index
│   ├── inheritance.md             # Package hierarchy, dependency graph, layers
│   └── projects/
│       ├── README.md              # Index
│       ├── storybook.md           # nice-storybook structure
│       └── website.md             # nice-website-2025 structure
├── create/                        # CREATING new assets
│   ├── README.md                  # Index
│   ├── component.md               # Component package structure, types, tokens
│   ├── configuration.md           # Build config patterns, deviation audit
│   └── storybook.md               # Story file patterns
├── build/                         # LOCAL DEVELOPMENT
│   ├── README.md                  # Index
│   ├── symlinks.md                # file: references, nice-npm-link commands
│   └── vite.md                    # nice-vite-symlink-watcher usage
└── publish/                       # RELEASING
    ├── README.md                  # Index
    ├── git.md                     # Commit format, branching
    └── npm.md                     # Version bumping, publish order
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
| New component package | `read/inheritance.md` → `create/component.md` |
| New story | `create/storybook.md` |
| Build config issue | `create/configuration.md` |
| Linked package not updating | `build/symlinks.md` or `build/vite.md` |
| Publishing | `publish/npm.md` |
| Understanding dependencies | `read/inheritance.md` |

---

## Update Rules

1. New pattern discovered → add to relevant file
2. Documentation contradicts code → fix documentation
3. New file needed → place in `read/` (understanding) or `create/` (making) or `build/` (developing) or `publish/` (releasing)
4. Keep entries terse - tables and code blocks, not prose