# Audit

## Purpose of This Document

This manifest is a **comprehensive living guide** designed to give AI instances full context into the Nice ecosystem and its related projects and components. Every pattern, convention, and piece of logic that an AI assistant might need when working on nice-* packages should be documented here.

**If it's not in this documentation, an AI instance won't know it exists.**

---

## Two Parallel Tasks

When improving the Nice ecosystem, execute both tasks simultaneously:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────┐       ┌─────────────────────────────┐  │
│  │  Task 1:            │       │  Task 2:                    │  │
│  │  Consistency Audit  │       │  Improvement Collection     │  │
│  │                     │       │                             │  │
│  │  Compare packages   │  ───► │  Note patterns, gaps,       │  │
│  │  against docs       │       │  and opportunities          │  │
│  │                     │       │                             │  │
│  └─────────────────────┘       └─────────────────────────────┘  │
│                                                                 │
│                              ▼                                  │
│                                                                 │
│                 ┌─────────────────────────┐                     │
│                 │  Update Manifest        │                     │
│                 │  Documentation          │                     │
│                 └─────────────────────────┘                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Task 1: Consistency Audit

Review all nice-* packages and verify alignment with manifest documentation.

### Packages to Audit

| Layer | Packages |
|-------|----------|
| Foundation | nice-styles, nice-icons, nice-configuration, nice-npm-link, nice-vite-symlink-watcher |
| Context | nice-react-styles |
| Utility | nice-react-flex, nice-react-typography, nice-react-tile, nice-react-scroll, nice-react-slider, nice-react-device-detector |
| Feature | nice-react-icon, nice-react-button |
| Application | nice-storybook, nice-website-2025 |

### Audit Checklist

| Check | Files to Review | Documentation Reference |
|-------|-----------------|------------------------|
| Folder structure | `src/` layout | `edit/component.md` → Folder Structure |
| Export rules | `index.ts` files | `README.md` → Export Rules |
| Type naming | `*.types.ts` files | `edit/component.md` → Type Naming Convention |
| Token structure | `src/tokens/` files | `edit/component.md` → src/tokens |
| CSS variable naming | Token maps, styled-components | `read/styles/tokens.md` |
| Dependency declarations | `package.json` files | `edit/component.md` → Local Development Dependencies |
| Build config | `rollup.config.js`, `tsconfig.json` | `edit/component.md` → Rollup Configuration |

### Deviation Categories

- **Code needs fix**: Implementation violates documented pattern
- **Docs need update**: Documentation doesn't reflect intentional pattern
- **Decision needed**: Ambiguous case requiring clarification

---

## Task 2: Improvement Collection

Gather enhancements from manifest analysis and package implementations.

### Output Format

```markdown
### [Category]

#### [Title]
- **Package(s)**: affected packages
- **Current**: how it works now
- **Proposed**: suggested change
- **Impact**: what this improves
- **Priority**: low | medium | high
```

---

## Known Documentation Gaps

The following logic exists in packages but may be underdocumented or missing from manifest:

### Foundation Layer

#### nice-styles
- `getBreakpoint()` service with media query generation
- `camelToKebab()` and `camelToScreaming()` utilities
- Layout types: `SpacingType`, `SpacingShorthandType`, `SpacingDefinitionType`, `SpacingResponsiveType`
- Breakpoint system: mobile (640px), tablet (641px), desktop (1280px)
- Auto-generated files: `types.ts`, `tokensData.ts` from `tokens.json`

#### nice-icons
- Auto-generated `index.js` via `scripts/generateIndex.js`
- Icon discovery pattern: folders with `stroke.svg` and `fill.svg`
- PascalCase conversion for export names
- 31 icons with stroke/fill variants (62 total exports)

#### nice-configuration
- `isNiceExternal()` function for dependency detection
- `createExternals()` for custom external functions
- Watch mode configuration with polling and debouncing
- Jest config: `transformIgnorePatterns` excludes nice-* packages

#### nice-npm-link
- Full CLI flag documentation: `--exclude`, `--add-exclude`, `--watch-dir`, `--dry-run`, `--manager`, `--skip-peer-check`
- Keyed debouncing for file change batching
- Backup/restore mechanism via `.nice-npm-link/linked-packages.json`
- Watch trigger file pattern: `.symlink-trigger.js`
- Peer dependency enforcement: moves react/react-dom/styled-components to peerDependencies

#### nice-vite-symlink-watcher
- `getSourceAliases()` for direct source imports (bypasses dist)
- Source-aliasable packages pattern for true HMR
- Module graph invalidation strategy
- Keyed debouncer implementation

### Context Layer

#### nice-react-styles
- `createTokens()` auto-override detection for "app" prefix
- Font loading utilities: `parseGoogleFontsUrl()`, `getWeightAxis()`, `supportsVariableWeight()`
- `FontFaceStyles` component for @font-face generation
- Token resolution fallback: custom tokens → core Theme tokens

### Utility Layer

#### nice-react-flex
- `normalizeProps()` helper: converts simple values to `{ mobile: value }` format
- `parseSpacingShorthand()`: CSS-like shorthand parsing (1-4 values)
- Mobile-first responsive: simple values only apply at mobile breakpoint
- `styleFlex()` service generates CSS for each breakpoint

#### nice-react-typography
- Smart defaults based on element type (h1-h4 vs p/span)
- Font family selection: code → heading → base
- Antialiasing and legibility optimization CSS
- Duplicate file structure: root-level AND component-level (needs cleanup?)

#### nice-react-tile
- `TileLayout` and `TileSlot` internal components
- Background styling with orientation-based `background-attachment`
- Split layout pattern: left sidebar | main | right sidebar

#### nice-react-scroll
- RAF-batched scroll subscription pattern
- IntersectionObserver for sticky state and active section detection
- Stacking order calculation for multiple sticky elements
- Smooth scroll implementation: 300ms ease-in-out via RAF
- Keyed debouncing for scroll events

#### nice-react-slider
- Hardcoded 300ms animation duration (CSS and JS must match)
- `styleHideScrollbar` utility for cross-browser scrollbar hiding

#### nice-react-device-detector
- Debug mode: `localStorage.getItem("debug-mobile")` or `?mobile=true` URL param
- Detection priority: debug flags → user agent → touch + screen size
- Breakpoint: 480px for mobile threshold

### Feature Layer

#### nice-react-icon
- `buildIconMap()` helper: dynamically imports from nice-icons
- Icon naming convention: `{IconName}StrokeIcon`, `{IconName}FillIcon`
- Spinner icon auto-rotation animation
- `vector-effect: non-scaling-stroke` for stroke width preservation

#### nice-react-button
- Status/state token composition: `status${Status}${State}` pattern
- Transient props pattern: `$` prefix prevents DOM forwarding
- `capitalize()`, `isDisabled()`, `isSquare()` helpers
- `ButtonIcon` component exists but isn't used internally (legacy?)

### Application Layer

#### nice-storybook
- Story file conventions: `{Component}.stories.tsx` + `stories/{Variation}.story.tsx`
- Custom components: `Story`, `VariableList`, `VariableRow`, `CodePreview`, `TokenPreview`
- `generateDescriptionString()` service for docs
- `createToken()` service for token demos
- Source aliasing in Vite config for true HMR
- `scripts/watch-deps.js` for dynamic dependency watching

#### nice-website-2025
- `/src/nice/` wrapper component pattern
- Token override architecture via `createTokens()`
- Provider composition order: StylesProvider → DeviceProvider → ScrollProvider → StickyProvider
- `.symlink-trigger.js` pattern for CRA HMR with linked packages

### Packages Not Documented

| Package | Status | Notes |
|---------|--------|-------|
| nice-react-hook-device-detector | NPM alias | Same as nice-react-device-detector, published under different name |
| nice-website-2023 | Legacy | Gatsby project, intentionally omitted |
| nice-website-2024 | Legacy | Gatsby project, intentionally omitted |

---

## Trigger

To execute these tasks:

```
Review all nice-* packages at ~/Code/nice-* for consistency with nice-manifest documentation.
Collect improvement opportunities in parallel.
Update manifest documentation with any missing patterns or logic.
Output: deviation report + improvement backlog + documentation updates.
```
