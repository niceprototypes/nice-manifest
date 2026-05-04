# Audit

## Purpose of This Document

This manifest is a **comprehensive living guide** designed to give AI instances full context into the Nice ecosystem and its related projects and components.

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
| Foundation | nice-styles, nice-icons, nice-configuration, nice-toolkit, nice-vite-watcher |
| Context | nice-react-styles |
| Utility | nice-react-flex, nice-react-typography, nice-react-tile, nice-react-scroll, nice-react-slider, nice-react-device-detector, nice-react-image |
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
- `camelToKebab()` and `camelToScreaming()` in `src/utilities/`
- `getTokenFromMap()` engine in `src/utilities/` (used by getToken and getComponentToken)
- `formatError()` in `src/utilities/` for structured error messages
- Layout types: `SpacingType`, `SpacingShorthandType`, `SpacingDefinitionType`, `SpacingResponsiveType`
- Breakpoint system: mobile (640px), tablet (641px), desktop (1280px)
- Auto-generated files in `src/generated/`: `types.ts`, `tokensData.ts`, `componentTokensData.ts` from `src/tokens/` JSON
- Build scripts: `scripts/generateTokens.ts`, `scripts/generateTypes.ts`, `scripts/generateCss.ts`, `scripts/postBuild.ts`

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

#### nice-toolkit
- Full CLI flag documentation: `--exclude`, `--add-exclude`, `--watch-dir`, `--dry-run`, `--manager`, `--skip-peer-check`
- Keyed debouncing for file change batching
- Backup/restore mechanism via `.nice-toolkit/linked-packages.json`
- Watch trigger file pattern: `.symlink-trigger.js`
- Peer dependency enforcement: moves react/react-dom/styled-components to peerDependencies

#### nice-vite-watcher
- `getSourceAliases()` for direct source imports (bypasses dist)
- Source-aliasable packages pattern for true HMR
- Module graph invalidation strategy
- Keyed debouncer implementation

### Context Layer

#### nice-react-styles
- `createTokens()` auto-override detection for "app" prefix
- Font loading utilities in `src/utilities/`: `parseGoogleFontsUrl()`, `getWeightAxis()`, `supportsVariableWeight()`
- `tokenStyleSheet.ts` utility for runtime CSS injection via shared `<style data-nice-tokens>` element
- Token resolution fallback: custom tokens → core Theme tokens
- Re-exports `getComponentToken` and `ComponentPrefix` from nice-styles
- Shared types in `src/types.ts`: `GoogleFontsConfig`, `LinkAttributes`, `GoogleFontMetadata`, `FontAxis`

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
- `registerVendorResolver()` service: three-tier icon resolution (custom icons → vendor resolver → direct component)

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

### Package Status

| Package | Status | Notes |
|---------|--------|-------|
| nice-react-input | Stub | Placeholder component (`<div>{children}</div>`, one prop). Exclude from audits until implementation begins. |
| nice-react-image | Stub | No git repo or GitHub remote. Needs infrastructure setup before auditing. |
| nice-website-2023 | Legacy | Gatsby project, intentionally omitted |
| nice-website-2024 | Legacy | Gatsby project, intentionally omitted |

Packages marked **Stub** are not production-ready and should be excluded from consistency audits. They still receive structural scaffolding (package.exports.json, token wrappers) so they conform when implementation begins.

---

## Trigger

To execute these tasks:

```
Review all nice-* packages at ~/Code/nice-* for consistency with nice-manifest documentation.
Collect improvement opportunities in parallel.
Update manifest documentation with any missing patterns or logic.
Output: deviation report + improvement backlog + documentation updates.
```
