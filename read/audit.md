# Audit

Each audit takes one artifact and compares it against the **architecture — the
`nice-*` package source**, which is the source of truth: when a doc, a story, or
a consumer disagrees with the code, the code wins (unless the audit surfaces an
actual code bug, which is itself a separate, explicit finding).

The audits compose into two aggregates:

- **Architecture audit** — the `manifest ↔ architecture ↔ stories` triangle.
  **Three components:** the **manifest audit** and the **storybook audit**, both
  checked against the **architecture** (the package code) sitting between them.
  Run together they confirm the manifest *documents* and the stories *demonstrate*
  exactly what the code *is*. Scope stops at the ecosystem — no consumers.
- **Full audit** — the architecture audit **+ all consumers**. Everything above,
  plus a consumer audit of every consuming project. This is the whole system.

Say which audit you want. These trigger phrases disambiguate:

| Audit | Triggered by | Answers | Subject (audited) | Reference (truth) |
|-------|--------------|---------|-------------------|-------------------|
| **Architecture** | `architecture audit` | Do the manifest and stories match the architecture? | manifest docs **+** storybook stories | `nice-*` package source (architecture) |
| **Manifest** | `manifest audit` | Does the manifest line up with the architecture? | this manifest's docs | `nice-*` package source |
| **Storybook** | `storybook audit` | Do the stories accurately and fully report the architecture? | `nice-storybook` stories | `nice-*` public API, props, tokens |
| **Consumer** | `audit <project>`, `consumer audit of <project>`, `audit all consumers` | Does a consuming project use the ecosystem correctly? | one consumer project's code | ecosystem conventions + this manifest |
| **Full** | `full audit` | Is the entire system — architecture **and** every consumer — consistent? | architecture audit **+** all consumers | `nice-*` package source + conventions |

The **Architecture** and **Full** rows are aggregates: running one runs its
components (Architecture = Manifest + Storybook; Full = Architecture + every
consumer). Each component audit still writes to its own `.nice/` folder. The
aggregate itself writes a summary to `manifest/.reports/audit/audit-{YYYY-MM-DD}.md`. The
Manifest, Storybook, and Consumer audits are detailed in the numbered sections
below.

A bare, unqualified **`audit`** — no type and no project named — does **not**
default to any one audit. Respond like `npm help`: list the audit types (the
table above), each with its trigger phrase and one-line scope, and ask which to
run. Do **not** pick one and start. Only a qualified phrase runs an audit:
`architecture audit`, `full audit`, `manifest audit`, `storybook audit`,
`audit <project>` / `consumer audit of <project>` (a consumer audit of that
project), or `audit all consumers` (the consumer audit across every consumer
project).

---

## 1. Manifest audit

**Question:** does every claim in this manifest still match the `nice-*` source,
and does the manifest cover the patterns the code actually uses?

Two directions, run together:

- **Accuracy** — every documented pattern / value / API in the manifest is checked
  against the code. A mismatch is a finding.
- **Coverage** — logic that exists in the code but is absent from the manifest is a
  finding (see *Known manifest gaps* below).

### Checklist (manifest claim → code)

| Check | Code to read | Manifest reference |
|-------|--------------|--------------------|
| Folder structure | `src/` layout | `edit/component.md` → Folder Structure |
| Export rules | `index.ts` files | `README.md` → Export Rules |
| Type naming | `*.types.ts` files | `edit/component.md` → Type Naming Convention |
| Token structure | `src/tokens/` files | `edit/component.md` → src/tokens |
| CSS variable naming | token JSON, styled-components | `read/styles/tokens.md` |
| Dependency declarations | `package.json` files | `edit/component.md` → Local Development Dependencies |
| Build config | `rollup.config.js`, `tsconfig.json` | `edit/component.md` → Rollup Configuration |

### Finding categories

- **Docs need update** — the manifest is wrong/stale; fix the manifest (code wins).
- **Code needs fix** — the code violates a deliberate documented pattern; flag it
  for the package. Do **not** silently rewrite the doc to match a regression.
- **Decision needed** — ambiguous; surface for the user.

**Output:** a deviation report (manifest location → code reality → category) plus the
manifest edits that resolve every "Docs need update" finding. Write the report to
`manifest/.reports/audit/audit-{YYYY-MM-DD}.md`.

---

## 2. Storybook audit

**Question:** do `nice-storybook`'s stories report the ecosystem **accurately** and
**fully**?

- **Accuracy** — every story shows the real current API: correct prop names/types,
  correct token names/values, correct usage. A story demoing a removed prop, a
  renamed token, or a stale signature is a finding.
- **Completeness** — every public surface is represented: each component has a story;
  each documented prop / variant / token group is demoed; new tokens (e.g. the
  `$inverse` color dimension) and new components are covered. A missing story,
  missing variant, or undemoed token is a finding.

Reference: the `nice-*` public API + `read/styles/tokens.md` (token groups) +
`edit/storybook.md` (story conventions). Convention-violating stories are findings too.

**Output:** report of inaccurate / incomplete / convention-violating stories, with the
fix per item. Reports by default; only edits the stories when asked. Write the report
to `nice-storybook/.nice/audit-{YYYY-MM-DD}.md`.

---

## 3. Consumer audit

**Question:** does a **consuming project** (an app that depends on `nice-*`) use the
ecosystem correctly and idiomatically?

Triggered by naming the project — `audit website-viveka`, `do a consumer audit of
website-viveka`. `audit all consumers` runs it for every project below.

### Consumer projects

| Project | Notes |
|---------|-------|
| `nice-website-2025` (`website`) | CRA |
| `website-viveka` | CRA / craco |
| `website-ocean` | CRA / craco |

`nice-storybook` is a consumer too, but it is covered by the **storybook audit**, not here.

### What a consumer audit checks

- **Correct API usage** — components / services / tokens called with valid names and
  props; no invented token variants (every `getToken` argument exists), no removed
  props, no stale signatures.
- **Idiomatic usage over inlined logic** — the project reaches for the ecosystem
  service instead of re-implementing it. Examples: hand-rolled `data-theme` toggling
  where the inverse-color dimension (`getToken(group, undefined, { inverse: true })`) now exists; manual `var(--np--…)`
  strings where `getConstant` / `getCssConstant` belong; bespoke responsive code the
  breakpoint helpers already cover.
- **Consumer patterns** — the `src/nice/` wrapper convention, provider composition
  order, `file:` / semver dependency correctness, and `setTokens` override placement
  (per `read/projects/*` and the `edit/` docs).
- **Drift** — the project's `nice-*` versions and assumptions match the current
  ecosystem.

**Output:** a per-project report of misuse + idiomatic-improvement opportunities, each
with the concrete fix. Write the report to `{project}/.nice/audit-{YYYY-MM-DD}.md`.
When running `audit all consumers`, write one file per project in its own `.nice/`
folder.

---

## Status & exclusions (all audits)

| Package | Status | Notes |
|---------|--------|-------|
| nice-react-input | Stub | Placeholder component (`<div>{children}</div>`, one prop). Exclude from audits until implementation begins. |
| nice-react-image | Stub | No git repo or GitHub remote. Needs infrastructure setup before auditing. |
| nice-website-2023 | Legacy | Gatsby project, intentionally omitted |
| nice-website-2024 | Legacy | Gatsby project, intentionally omitted |

Packages marked **Stub** are not production-ready and are excluded from the manifest
and storybook audits. They still receive structural scaffolding (package.exports.json,
token wrappers) so they conform when implementation begins.

---

## Known manifest gaps (manifest-audit reference)

Logic that exists in the packages but the manifest under-documents — standing
**manifest-audit** findings to close as the docs catch up.

### Foundation Layer

#### nice-styles
- `getBreakpoint()` service with media query generation
- `camelToKebab()` and `camelToScreaming()` in `src/utilities/`
- `getTokenFromMap()` engine in `src/utilities/` (used by getToken and getComponentToken)
- `formatError()` in `src/utilities/` for structured error messages
- Layout types: `SpacingType`, `SpacingShorthandType`, `SpacingDefinitionType`, `SpacingResponsiveType`
- Breakpoint system: phone (0–640px), tablet (641–1279px), laptop (1280–1719px), desktop (1720px+)
- Auto-generated files in `src/generated/`: `types.ts`, `tokensData.ts`, `componentTokensData.ts` from `src/tokens/` JSON
- Build scripts: `scripts/generateTokens.ts`, `scripts/generateTypes.ts`, `scripts/generateCss.ts`, `scripts/postBuild.ts`

#### nice-icons
- Auto-generated `index.js` + `index.d.ts` + data-only `catalog.js`/`catalog.d.ts` via `scripts/generateIndex.js`
- `src/`-based layout (like nice-styles): `.ai` sources in `src/source/{category}/{icon}/`, generated SVG set + index in `src/generated/` (the published surface). `--convert [path]` turns `.ai` → SVG via nice-svg-generator (a folder or single `.ai`; omit for all); build never deletes SVGs so hand-authored icons persist
- Icon discovery pattern: `src/generated/{category}/{icon}/` folders (categories `base/`, `brands/`) with `stroke.svg` and `fill.svg`; icons named by leaf only, cross-category name collisions rejected at build time
- PascalCase conversion for export names
- `iconCategories` grouping export (internal/presentation only) alongside `iconNames`; both live in `nice-icons/catalog`
- SVG scrubber (`scripts/scrubSvg.js` + `svgStyle.config.js`) applies semantic classes per variant
- 51 icons with stroke/fill variants (102 total exports; 39 base + 12 brands)

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
- `setTokens()` auto-override detection for "app" prefix
- Font loading utilities in `src/utilities/`: `parseGoogleFontsUrl()`, `getWeightAxis()`, `supportsVariableWeight()`
- `tokenStyleSheet.ts` utility for runtime CSS injection via shared `<style data-nice-tokens>` element
- Token resolution fallback: custom tokens → core Theme tokens
- Re-exports `getComponentToken` and `ComponentPrefix` from nice-styles
- Shared types in `src/types.ts`: `GoogleFontsConfig`, `LinkAttributes`, `GoogleFontMetadata`, `FontAxis`

### Utility Layer

#### nice-react-flex
- `normalizeProps()` helper: converts simple values to `{ phone: value }` format
- `parseSpacingShorthand()`: CSS-like shorthand parsing (1-4 values)
- Phone-first responsive: simple values only apply at phone breakpoint
- `styleFlex()` service generates CSS for each breakpoint

#### nice-react-ink
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

### Feature Layer

#### nice-react-icon
- `buildIconMap()` helper: dynamically imports from nice-icons
- `iconNames` / `IconNameType` derive from nice-icons' generated export (`src/constants.ts` re-exports `iconNames` from `nice-icons`); no hand-maintained name list, and `src/icons.d.ts` no longer declares the `nice-icons` module (that package now ships its own types)
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
- Token override architecture via `setTokens()`
- Provider composition order: StylesProvider → ScrollProvider → StickyProvider (device detection is folded into StylesProvider via `detectDevice`)
- `.symlink-trigger.js` pattern for CRA HMR with linked packages
