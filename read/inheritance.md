# Nice Ecosystem Inheritance Tree

This document maps the dependency relationships between the Nice Prototypes packages. Each is its own repository; the layers below describe which packages depend on which, not a shared build or a single tree.

Versions in headings and dependency ranges: each `package.json` on disk, 2026-10-15. Authoritative tier order: `toolkit/registry.json`.

---

## Layered Architecture Overview

Dependencies run in one direction only: a package may depend on packages in the layers below it, never on one above or beside it. The layers are a constraint on the dependency graph between independent repositories, not a description of one application's internal structure.

```
┌───────────────────────────────────────┐
│  APPLICATION LAYER                    │
│───────────────────────────────────────│
│  nice-storybook                       │
│  nice-website-2025                    │
└───────────────────────────────────────┘
                  ▼
┌───────────────────────────────────────┐
│  FEATURE LAYER                        │
│───────────────────────────────────────│
│  nice-react-button (feature)          │
│  └─ nice-react-icon (utility)         │
│     └─ nice-icons (foundation)        │
│     └─ nice-react-styles (context)    │
│        └─ nice-styles (foundation)    │
└───────────────────────────────────────┘
                  ▼
┌───────────────────────────────────────┐
│  UTILITY LAYER                        │
│───────────────────────────────────────│
│  nice-react-icon                      │
│  nice-react-flex                      │
│  nice-react-ink                       │
│  nice-react-tile                      │
│  nice-react-scroll                    │
│  nice-react-slider                    │
│  nice-react-image                     │
└───────────────────────────────────────┘
                  ▼
┌───────────────────────────────────────┐
│  CONTEXT LAYER                        │
│───────────────────────────────────────│
│  nice-react-styles (React bridge)     │
│  └─ StylesProvider                    │
│  └─ Theme (data-theme pin wrapper)    │
│  └─ setTokens (React shim)            │
│  └─ withBreakpoints / useBreakpoint   │
└───────────────────────────────────────┘
                  ▼
┌───────────────────────────────────────┐
│  FOUNDATION LAYER                     │
│───────────────────────────────────────│
│  nice-styles                          │
│  nice-icons                           │
│  nice-config-*                        │
│  nice-toolkit                         │
│  nice-vite-watcher                    │
└───────────────────────────────────────┘
```

---

## Foundation Layer

### nice-styles (v17.1.0)

**Role:** Core design token system - the root of all styling inheritance

**Dependencies:** None (zero dependencies)

**Import guidance:** React projects should import nice-styles assets from `nice-react-styles`, which re-exports the entire nice-styles public API. Import directly from `nice-styles` only when working outside the React framework (e.g., vanilla JS, build scripts, non-React tooling).

**Exports:**
- Token getter: `getToken(name | path, variant, { prefix, theme, breakpoint, inverse, pristine, as })` — the single getter for core, custom, theme, breakpoint, inverse, and component tokens (`as`: `"var"` / `"key"` / `"value"`).
- CSS-variable name constructor: `getConstant()` / `getConstantKey()` (name only, no lookup).
- Breakpoint helpers: `getBreakpoint()` (returns `@media` string), `getBreakpointValue()` (returns pixel number).
- Setters: `registerTokens` (runtime registry layer). Tokens and breakpoint thresholds are set together through `generateTokenCSS` / nice-react-styles `setTokens` (reserved `breakpoints` key).
- Generators: `generateTokenCSS()` (registers + builds CSS for `setTokens`), `injectTokenCSS()` (singleton `<style data-nice-tokens>` writer).
- Registry: `registry` (one store keyed by CSS variable name, seed + runtime layers).
- Style-value helpers: `isStyleValue()`, plus types `ThemeValue`, `BreakpointValue`, `StyleValueKind`.
- Constants: `NAMESPACE` (`"np"`), `DEFAULT_THEME`, `DEFAULT_BREAKPOINT`, `STYLE_VALUE_KEYS`, `BREAKPOINT_PHONE/TABLET/LAPTOP/DESKTOP`, `BREAKPOINTS`.
- Google Fonts: `parseGoogleFontsUrl()`, types `FontAxis`, `GoogleFontMetadata`, `LinkAttributes`, `GoogleFontsConfig`.
- Generated token types: `TokenResult`, `TokenDefinition`, `TokenMap`, `ComponentPrefix`, `CssConstantResult`, `CssConstantOptions`, `BorderRadiusType`, `FontSizeType`, etc.
- Layout types: `SpacingType`, `SpacingShorthandType`, `SpacingDefinitionType`, `SpacingResponsiveType`.
- CSS files: `tokens.css`.

**Internal structure:**
- `src/services/` — public functions (getToken, getConstant / getConstantKey, getBreakpoint, generateTokenCSS, transformColor, parseGoogleFontsUrl).
- `src/registry/` — the token store (createRegistry, registerTokens), keyed by CSS variable name; seeded from all generated data at module load via `init.ts` → `registry/index.ts`.
- `src/utilities/` — internal (camelToKebab, breakpointKeyMap, formatError, isStyleValue, resolveBreakpointValue, applyBreakpoints, tokenStyleSheet, breakpointStyleSheet) plus `utilities/css/` — the token CSS builders and emitters shared by the build and runtime (types, declarations, blocks, treeWalk, coreTokenCss, componentTokenCss, breakpointTokenCss, componentBreakpointTokenCss, extraThemeTokenCss, componentAliasCss).
- `src/types/` — style-value and Google Fonts type modules.
- `src/constants/` — breakpoints, styleValues (DEFAULT_THEME/BREAKPOINT, STYLE_VALUE_KEYS).
- `src/generated/` — auto-generated by build scripts (tokensData.ts, themeTokensData.ts, breakpointTokensData.ts, componentTokensData.ts, breakpointsData.ts, types.ts).
- `src/tokens/` — source JSON: `modules/{group}.json` (one file per token group), `components/{prefix}.json` (one per component), `breakpoints.json` (pixel thresholds). Each module/component file carries inline `$breakpoints` and `$themes` overrides; both folders are glob-discovered.

**Inheritors:** All nice-react-* component packages (via nice-react-styles re-exports)

---

### nice-icons (v4.0.0)

**Role:** SVG icon asset library

**Dependencies:** None

**Structure (nice-styles-aligned `src/` layout):**
- `src/source/{category}/{icon}/{stroke,fill}.ai` — Adobe Illustrator sources (authoring input), converted to SVG by `--convert` (nice-svg-generator, no pdf2svg). Not published.
- `src/generated/{category}/{icon}/{stroke,fill}.svg` — the icon SVG set (converted from `.ai`, or hand-authored) plus the generated `index.js` / `catalog.js` / `index.d.ts` / `catalog.d.ts`. **Published surface** (`files: ["src/generated"]`).

Categories today: `base/` (core UI icons) and `brands/` (product/brand logos). The category is **organizational only**: an icon is exported and called by its **leaf name alone** (`check`, `discord`, `lightbulb`), never `base/check`. Two icons in different categories may not share a name; `scripts/generateIndex.js` throws on any such collision. `package.json` `main`/`exports` target `src/generated/` (`.` → index, `./catalog` → catalog, `./*` → raw SVG subpaths). `generateIndex.js` walks `src/generated/` to rebuild the index and **never deletes SVGs**, so hand-authored icons without an `.ai` persist. `--convert [path]` converts `.ai` under `src/source/` (a folder or a single `.ai` file; omit for all).

**Exports (generated by `scripts/generateIndex.js`):**
- `{Name}StrokeIcon` / `{Name}FillIcon` per icon (raw SVGs, SVGR-transformed into React components by consumers) — 52 icons today (40 base + 12 brands)
- `iconNames` (flat name array) and `iconCategories` (`{ base, brands }` grouping) — re-exported from the **data-only `nice-icons/catalog` entry** (no SVG imports, so tooling can read the catalog without pulling every icon module). Categories are internal/presentation only — never needed to call an icon.
- Generated `index.d.ts` + `catalog.d.ts` give the set a typed surface (`iconNames` as a readonly literal tuple).

**Inheritors:** `nice-react-icon` (bundles the SVGs via SVGR; derives its `iconNames` / `IconNameType` from this package — no hand-maintained list)

---

### nice-config-* (split configuration packages)

**Role:** Shared build tool configuration, one package per tool (`~/nice/config-*`)

**Packages (version on disk):** `nice-config-typescript` 1.0.0 (`./base`, `./react`), `nice-config-rollup` 1.0.0 (`createConfiguration`), `nice-config-jest` 1.0.0 (`./react`, `./css-mock`), `nice-config-exports` 1.0.1 (`nice-generate-exports`), `nice-config-eslint` 1.0.0, `nice-config-prettier` 1.0.0, `nice-config-vite` 0.1.0, `nice-config-crxjs` 0.1.0. Exports and options: [`topics/build-config.md`](../topics/build-config.md).

**Inheritors:** All nice-react-* packages (devDependency)

---

### nice-toolkit (v5.0.0)

**Role:** Development utility for local package linking and conflict resolution

**Exports:** CLI commands `nice-toolkit` (long form) and `nicely` (short alias).

**Key Commands:**
- `clean`: Kill dev-server ports (discovered from each consumer's `.env` / package.json) and wipe `node_modules/.cache` + `.vite` across the workspace
- `dedupe`: Recursively clean singletons (react, styled-components, etc.) from linked packages' `node_modules`
- `build all`: Walk registry tier order, run `npm run build` in every linked nice-* package (replaces the `prepare` hook that was removed from package.json files)
- `build icons`: Rebuild only `nice-icons` and its transitive dependents (`nice-react-icon`, `nice-react-icon-vendor`, `nice-react-button`) in tier order — the targeted subset of `build all` for an SVG/icon-asset change. Affected set resolved via the same reverse-dependency graph `publish` uses.
- `reset`: Chain `build all → dedupe → clean` in sequence. Use after refactors that touch foundation packages (e.g. token renames, type narrowing in nice-styles).
- `develop`: Rebuild + reload loop across linked packages (`--reload-only` / `--no-reload` split the two halves)
- `unlink`: Restore packages to npm versions

---

### nice-vite-watcher (v0.1.4)

**Role:** Vite plugin for hot-reloading linked packages

**Exports:** Vite plugin function

**Inheritors:** `nice-storybook`, `nice-website-*` projects

---

## Context Layer

### nice-react-styles (v15.0.1)

**Role:** Bridge between nice-styles tokens and React components

**Dependencies:**
- `nice-styles` (^17.1.0, peer)

**Peer Dependencies:**
- `react` (>=19.2.0)
- `react-dom` (>=19.2.0)
- `styled-components` (>=6.1.18)

**Role-statement:** A *thin React-bridge package.* All framework-agnostic logic lives in `nice-styles`. nice-react-styles owns the React-only surface: a `ThemeProvider`-backed `StylesProvider`, a `Theme` pin component, a `useBreakpoint` hook, a `withBreakpoints` HOC, and a `setTokens` React wrapper.

**Exports:**
- Component: `StylesProvider`, `FontLoader` (internal to StylesProvider's font-loading path), `Theme` (pins a subtree to a theme via `data-theme`).
- React wrapper: `setTokens()` — calls `generateTokenCSS` + `injectTokenCSS` from nice-styles; CSS is injected synchronously at call time. Returns `getToken` typed for the core tokens plus the map (`export const getToken = setTokens(map)`).
- React HOC + hook: `withBreakpoints`, `useBreakpoint`.
- Device/theme detection (opt-in, folded into `StylesProvider`): the `detectDevice` prop runs an internal `useDeviceDetection` hook once and publishes device state through context, read via `useDevice(mobileUserAgents?)` → `{ userAgent, mobileUserAgents, isMobile }`; the `detectTheme` prop publishes `{ theme }` (follows OS `prefers-color-scheme`), read via `useTheme()`. Both default `false` and are inert when off — `useDevice()` → `{ userAgent: "", mobileUserAgents: MOBILE_USER_AGENTS, isMobile: false }`, `useTheme()` → `DEFAULT_THEME` — registering no resize / media-query listener. `isMobile` is true when `userAgent` matches an entry of `mobileUserAgents` (the default `MOBILE_USER_AGENTS`, overridable per call) OR a touch + small-screen / debug signal fires.
- Type: `Breakpoints<T>` (React-prop responsive shape).
- Re-exports the entire nice-styles public API (all token getters, setters, constants, types) so consumers can import everything from `"nice-react-styles"`.

**Internal structure:**
- `src/components/StylesProvider/` — `StylesProvider.tsx`, `StylesProvider.styled.ts`, `StylesProvider.types.ts`, `index.ts`.
- `src/components/FontLoader/` — async font-link injection.
- `src/services/setTokens/index.ts` — ~56-line React shim calling `generateTokenCSS` + `injectTokenCSS`.
- `src/services/withBreakpoints/` — HOC + `useBreakpoint` hook.
- `src/components/StylesProvider/DeviceContext.tsx` — `useDevice(mobileUserAgents?)` hook + `DeviceDetectionProvider` (wraps the internal `useDeviceDetection` hook in `useDeviceDetection.ts`, mounted by `StylesProvider` only when `detectDevice` is set); `ThemeContext.tsx` — `useTheme()` hook + theme detection (mounted only when `detectTheme` is set).
- `src/components/StylesProvider/useDeviceDetection.ts` — internal mobile detection (folded in when the standalone device-detection package was retired); exports `MOBILE_USER_AGENTS` (the default user-agent list) and the `matchesMobileUserAgent` helper.
- `src/types.ts` — `Breakpoints<T>` only; all token-system types live in nice-styles.

**Inheritors:** `nice-react-ink`, `nice-react-icon`, `nice-react-button`

---

## Utility Layer

### nice-react-flex (v7.0.1)

**Role:** Responsive flexbox layout component

**Dependencies:**
- `nice-react-styles`

**Peer Dependencies:**
- `react`, `react-dom`, `styled-components`

**Exports:**
- Component: `Flex`
- Services: `getBreakpointValue()`, `getGapSize()`, `getSpacingValue()`, `isResponsiveObject()`, `styleSpacing()`, `styleFlex()`
- Types: `FlexTypes.*`

**Inheritors:** `nice-react-tile`, `nice-react-button` (peer dependency)

---

### nice-react-ink (v8.0.3)

**Role:** Semantic ink component

**Dependencies:**
- `nice-react-styles`

**Peer Dependencies:**
- `react`, `react-dom`, `styled-components`

**Exports:**
- Component: `Ink`
- Types: `InkProps`, `AsType`, `AlignType`

**Inheritors:** `nice-react-button`

---

### nice-react-tile (v14.0.0)

**Role:** Responsive grid/tile layout component

**Dependencies:**
- `nice-react-styles`

**Peer Dependencies:**
- `nice-react-flex` (^7.0.1)
- `react`, `react-dom`, `styled-components`

**Exports:**
- Component: `Tile`
- Types: `TileProps`, `TileMaxWidthType`, `TileMaxWidthValueType`, `TileAlignItemsType`, `TileJustifyContentType`, `TileBackgroundColorType`, `TileColorType`, `TileBackgroundSizeType`, `TileInkProps`

---

### nice-react-scroll (v2.2.2)

**Role:** Performance-optimized scroll management

**Dependencies:** None (runtime)

**Peer Dependencies:**
- `react`, `react-dom`, `styled-components`

**Exports:**
- Provider: `ScrollProvider`, `ScrollContext`
- Hook: `useScroll()`
- Components: `Sticky`, `StickyProvider`, `FadeOnScroll`, `StickySectionLinks`, `StickySection`

---

### nice-react-slider (v0.5.5)

**Role:** Animated vertical slider component

**Dependencies:** None (runtime)

**Peer Dependencies:**
- `react`, `styled-components`

**Exports:**
- Component: `Slider`
- Types: `SliderProps`, `SliderChildrenType`, etc.

---

## Feature Layer

### nice-react-icon (v8.0.3)

**Role:** Flexible icon component with built-in icons

**Dependencies:**
- `nice-icons` (devDependency `file:../icons`; SVGs bundled into dist)
- `nice-react-styles`

**Peer Dependencies:**
- `react`, `react-dom`, `styled-components`

**Exports:**
- Component: `Icon`
- Service: `getIcon()`, `registerVendorResolver()`
- Constants: `iconNames`
- Types: `IconProps`, `IconNameType`, `IconSizeType`, `IconColorType`

**Inheritors:** `nice-react-button` (peer dependency)

---

### nice-react-button (v9.1.3)

**Role:** Accessible, themable button component

**Dependencies:**
- `nice-react-styles`
- `nice-react-ink` (^8.0.3)

**Peer Dependencies:**
- `nice-react-flex` (^7.0.1)
- `nice-react-icon` (^8.0.3)
- `nice-react-ink` (^8.0.3)
- `react`, `react-dom`, `styled-components`

**Exports:**
- Component: `Button`
- Types: `ButtonProps`, `ButtonBorderRadiusType`, `ButtonBorderColorType`, `ButtonStatusType`, `ButtonStateType`

---

### nice-react-lightbox (v3.0.0)

**Role:** Fullscreen image lightbox with portal rendering

**Dependencies:**
- `nice-react-styles`

**Peer Dependencies:**
- `react`, `react-dom`, `styled-components`

**Exports:**
- Component: `Lightbox`
- Types: `LightboxProps`, `LightboxImageUrlType`, `LightboxAltType`, `LightboxTitleType`, `LightboxDescriptionType`

---

### nice-react-image (v3.0.2)

**Role:** Image component with two rendering modes (`as="img"` / `as="div"` background-image) and optional token-based border

**Dependencies:**
- `nice-react-styles`

**Peer Dependencies:**
- `react`, `react-dom`, `styled-components`

**Exports:**
- Component: `Image`
- Service: `registerVendorResolver()`
- Types: `ImageProps`, `ImageAsType`, `ImageSrcType`, `ImageAltType`, `ImageWidthType`, `ImageHeightType`, `ImageBackgroundSizeType`, `ImageBackgroundPositionType`, `ImageBorderRadiusType`, `ImageBorderedType`, `ImageBorderWidthType`, `ImageBorderColorType`, `ImageThemeType`, `ImageRenderImageType`, `ImageVendorType`

**Border props (v ≥ Mode unification cycle):**
- `bordered: ImageBorderedType` — boolean gate; renders a border using design tokens when true.
- `borderWidth: ImageBorderWidthType` — `BorderWidthType` re-export (default `"base"`).
- `borderColor: ImageBorderColorType` — `BorderColorType` re-export (default `"base"`).
Applied for both `as="img"` and `as="div"` rendering paths via the shared style fragment.

---

### nice-react-tooltip (v0.1.2)

**Role:** Tooltip wrapper — wraps any element and shows an inverse-themed bubble on hover or click

**Dependencies:**
- `nice-react-styles`

**Peer Dependencies:**
- `react`, `react-dom`, `styled-components`

**Exports:**
- Component: `Tooltip`
- Types: `TooltipProps`, `TooltipTriggerType`, `TooltipPositionType`, `TooltipContentType`, `TooltipDelayType`, `TooltipClassNameType`

**Notes:** Colored with the inverse dimension of the `color` / `backgroundColor` tokens, so the bubble renders as the opposite theme and flips with the cascade. Bubble is portal-rendered (`position: fixed` at `<body>`) so it is never clipped by an overflow ancestor. Props: `content`, `trigger` (`hover` default / `click`), `position` (`top` default / `bottom` / `left` / `right`), `delayShow` / `delayHide` (ms). No component-token file — styled from module tokens only. Positioning comes from `nice-react-popover`'s `computeAnchorPosition` (dependency since 2026-09-24); bubble has `role="tooltip"`, trigger gets `aria-describedby` while shown.

---

### nice-react-dialog (v0.1.0, local-only)

**Role:** Controlled modal on the native `<dialog>` (`showModal()`, top layer — no portal, no z-index)

**Dependencies:**
- `nice-react-styles`

**Peer Dependencies:**
- `react`, `styled-components`

**Exports:**
- Component: `Dialog`
- Types: `DialogProps`, `DialogOpenType`, `DialogOnCloseType`, `DialogTitleType`, `DialogDescriptionType`, `DialogActionsType`, `DialogCloseOnBackdropClickType`, `DialogRefType`, `DialogThemeType`

**Notes:** Props: `open`, `onClose`, `title` (h2, `aria-labelledby`), `description` (p, `aria-describedby`), `children`, `actions`, `closeOnBackdropClick` (default true), `id`, `ref`, `theme`. Escape = native `cancel`, prevented, calls `onClose`; an unrequested native close also calls `onClose`. Focus returns to the element focused before open; `<html>` overflow locked while open. No component-token file — styled from module tokens only; width and `::backdrop` stay on UA defaults until `dialog.*` tokens exist.

---

## Forms (nice-ui form slice)

Designed as one unit, shipped as separate packages. Input is the field chrome every text-like control overloads; derived packages extend `InputAs{Input|Select|Textarea}Props` and render through `<Input as=…>`, never restyling the chrome. Registry tiers are authoritative for build/publish order (`toolkit/registry.json`); the layer diagram above predates them.

| Package | Tier | Depends on (nice-*) | Exports | Status |
|---|---|---|---|---|
| nice-react-list | 2 | react-styles | `List`, `ListItem`: core generic list — start/end slots, `<hr>` dividers between items (inside `<li aria-hidden role=presentation>`), `scrollable`, visual selected/active/disabled; all HTML attributes pass through (no listbox API — higher layers add role/aria) | local-only 0.1.0 |
| nice-react-popover | 2 | react-styles | `Popover` (portal, anchor positioning, Escape/outside dismiss, focus return), `computeAnchorPosition` | local-only 0.1.0 |
| nice-react-field | 3 | react-styles, react-ink | `Field`, `Fieldset`, `useField`, `FieldContext`, `mergeDescribedBy` (order: description, error, consumer; deduped) | local-only 0.1.0 |
| nice-react-input | 5 | react-styles, react-field | `Input`: wrapper chrome around `as="input"\|"select"\|"textarea"`, `ref`, `start`/`end` slots, `width` (character scale), token colour props, `useField` wiring, 16px font floor | 3.0.2 on disk; unpublished major pending |
| nice-react-select | 6 | react-input, react-list, react-popover, react-icon, react-styles | `Select`: default = WAI-ARIA select-only combobox (read-only Input `role=combobox` + Popover + List as listbox, option start/end slots, typeahead, hidden input for forms); `native` prop renders the platform `<select>` through `<Input as="select">` | local-only 0.1.0 |
| nice-react-calendar | 6 | react-input, react-popover, react-button, react-icon, react-styles | `Calendar` (ARIA grid, locale week start, RTL-aware keys), `DateField` (picker-only; hidden ISO input) — dates are ISO `YYYY-MM-DD` strings, never `Date` | local-only 0.1.0 |

Component tokens: `input.json` (size, spacing, radius, border, width, fontSize, focusRing, backgroundColor, borderColor), `popover.json`, `field.json`, `select.json`, `calendar.json`, `list.json` in `nice-styles/src/tokens/components/`. Locale/direction for JS: `useLocale()` from nice-react-styles.

---

## Token Inheritance Chain

Components inherit design tokens through a specific chain:

```
nice-styles source JSON
    │
    │  Modules:    src/tokens/modules/{group}.json    (incl. $breakpoints + $themes)
    │  Components: src/tokens/components/{prefix}.json (incl. $breakpoints + $themes)
    │  Defines: --np--font-size--*, --np--button--size--*, etc.
    │
    ▼
Build scripts (generate*.ts)
    │
    │  Outputs:
    │  • src/generated/tokensData.ts (core values)
    │  • src/generated/componentTokensData.ts (component values)
    │  • src/generated/types.ts (type unions, ComponentPrefix)
    │  • dist/tokens.css (all CSS custom properties)
    │
    ▼
getToken() from nice-styles (re-exported by nice-react-styles)
    │
    │  Reads the registry (seeded from componentTokensData + setTokens overrides)
    │  Example: getToken("button.size:base") → "var(--np--button--size)"
    │
    ▼
{Component}.tsx
    │
    │  Consumes token values via styled-components
    │
    ▼
Application (nice-storybook, nice-website-*)
```

---

## Dependency Graph

### Direct Dependencies

All nice-* interdependencies use `file:` references for local development.

| Package | Runtime Dependencies | Peer Dependencies |
|---------|---------------------|-------------------|
| nice-styles | (none) | (none) |
| nice-icons | (none) | (none) |
| nice-config-rollup | rollup plugins | rollup, tslib, typescript |
| nice-react-styles | nice-styles | react, styled-components |
| nice-react-flex | nice-react-styles | react, styled-components |
| nice-react-ink | nice-react-styles | react, styled-components |
| nice-react-tile | nice-react-styles | nice-react-flex, react, styled-components |
| nice-react-scroll | (none) | react, styled-components |
| nice-react-slider | (none) | react, styled-components |
| nice-react-icon | nice-icons (bundled), nice-styles (required by the bundled nice-icons code), nice-react-styles | react, styled-components |
| nice-react-button | nice-react-styles, nice-react-ink | nice-react-flex, nice-react-icon, react, styled-components |
| nice-react-lightbox | nice-react-styles | react, react-dom, styled-components |
| nice-react-image | nice-react-styles | react, react-dom, styled-components |
| nice-react-tooltip | nice-react-styles, nice-react-popover, nice-icons | react, react-dom, styled-components |
| nice-react-form | nice-react-styles | react, react-dom, styled-components |
| nice-react-dialog | nice-react-styles | react, styled-components |
| nice-react-popover | nice-react-styles | react, react-dom, styled-components |
| nice-react-field | nice-react-styles, nice-react-ink | react, react-dom, styled-components |
| nice-react-input | nice-react-styles, nice-react-field | react, react-dom, styled-components |
| nice-react-list | nice-react-styles | react, react-dom, styled-components |
| nice-react-select | nice-react-input, nice-react-list, nice-react-popover, nice-react-icon, nice-react-styles | react, react-dom, styled-components |
| nice-react-calendar | nice-react-input, nice-react-popover, nice-react-button, nice-react-icon, nice-react-styles | react, react-dom, styled-components |
| nice-react-head | (none) | react |
| nice-react-icon-vendor | lucide | nice-react-icon, react |
| nice-react-image-vendor | (none) | nice-react-image, react |

### Transitive Dependencies

```
nice-react-button
├── nice-react-styles
│   └── nice-styles
├── nice-react-ink
│   └── nice-react-styles
│       └── nice-styles
├── nice-react-flex (peer)
│   └── nice-react-styles
│       └── nice-styles
└── nice-react-icon (peer)
    ├── nice-icons
    └── nice-react-styles
        └── nice-styles
```

---

## File Organization Patterns

Each Nice component package follows this structure:

```
src/
├── components/
│   └── {Component}/
│       ├── {Component}.tsx          # Component implementation (default export)
│       ├── {Component}.types.ts     # Types with namespace pattern
│       ├── {Component}.test.tsx     # Co-located tests
│       └── index.ts                 # Re-exports
├── services/                        # Public functions (exported)
│   └── index.ts
├── utilities/                       # Internal functions (not exported)
├── constants.ts                     # Static values
├── styles.ts                        # Styled components (not exported)
└── index.ts                         # Package entry point
```

---

## Type Inheritance Pattern

Types follow a declaration merging namespace pattern:

```typescript
// {Component}.types.ts
export type ComponentSizeType = "small" | "base" | "large"
export interface ComponentProps { /* ... */ }

const ComponentTypes = {} as const
namespace ComponentTypes {
  export type Size = ComponentSizeType
  export type Props = ComponentProps
}
export default ComponentTypes
```

**Usage:**
```typescript
import ComponentTypes from "nice-react-component"

const props: ComponentTypes.Props = { /* ... */ }
const size: ComponentTypes.Size = "base"
```

---

## Build Configuration Inheritance

All packages extend shared build config from the `nice-config-*` packages — `nice-config-typescript/react` for tsconfig, `createConfiguration()` from `nice-config-rollup` for the bundle, `nice-config-jest/react` for Jest. Full standards, options, and per-package deviations: [`topics/build-config.md`](../topics/build-config.md).

---

## Package Categories Summary

| Category | Packages | Purpose |
|----------|----------|---------|
| **Foundation** | nice-styles, nice-icons, nice-config-* | Zero-dependency base assets |
| **Dev Tools** | nice-toolkit, nice-vite-watcher | Development utilities |
| **Context** | nice-react-styles | React/styled-components bridge |
| **Layout** | nice-react-flex, nice-react-tile | Flexbox/grid layout |
| **Content** | nice-react-ink | Text rendering |
| **Interaction** | nice-react-button, nice-react-scroll, nice-react-slider | User interactions |
| **Overlay** | nice-react-lightbox, nice-react-tooltip | Portal-rendered overlays |
| **Assets** | nice-react-icon, nice-react-image | Icon/image rendering |
| **Vendor add-ons** | nice-react-icon-vendor, nice-react-image-vendor | Optional third-party icon/image resolvers (Lucide, etc.); peer-depend on their base package |
| **Forms** | nice-react-form | Form inputs and controls |
| **Document head** | nice-react-head | `<head>` / metadata management |
| **Applications** | nice-storybook, nice-website-* | Consumer applications |