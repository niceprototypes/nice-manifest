# `mode` → `theme` Rename — Research

**Date:** 2026-05-26
**Scope:** All `~/nice/*` packages plus the storybook and website consumers.
**Driver:** The design-system concept currently called "mode" (with values `day`, `night`, and user-extensible custom names) is what the cascade actually selects via the `[data-theme="day"]` / `[data-theme="night"]` attribute selectors in `nice-styles/dist/tokens.css`. The API surface (types, services, props, JSON keys, generated-file names) still calls it "mode", forcing every reader to translate twice — once between code and CSS, and again between code and HTML. Renaming the API to `theme` aligns the three vocabularies so the same word is used end-to-end.

This document is research, not a step-by-step plan. It enumerates the surface a future rename would touch, the decisions that have been locked, and the non-theming uses of "mode" the rename must leave alone.

---

## Why now

Three reinforcing signals:

1. **The HTML attribute is `data-theme`, not `data-mode`.** Emitted by `nice-styles/scripts/css/assembleCombined.ts`, hardcoded in the dist `tokens.css`. CSS authoring already speaks `theme`.
2. **Third-party tooling speaks `theme`.** `storybook-dark-mode`'s state is consumed in `storybook/.storybook/preview.tsx:12-17` via a channel listener that translates `isDark: boolean` into `data-theme="day"|"night"` — the inverse of what the Nice API should be doing if its vocabulary were already aligned.
3. **The `Mode` component already outputs `data-theme`.** `react-styles/src/components/Mode/Mode.tsx:47-48` renders `<div data-theme={name}>`. The component is named after the input concept but the output uses the destination concept.

The cost of the mismatch is silent — readers learn the translation and stop noticing it. The benefit of removing it is also silent, but the rename gets harder as more `mode?:` props ship in new component packages.

---

## Decisions (locked)

1. **CSS variable suffix stays as `--day` / `--night`.** The rename targets the API layer, not the CSS authoring layer. Variables like `--np--color--day` and `--np--color--night` keep their existing names; no consumer's hand-written CSS breaks.
2. **JSON file renames.** `styles/src/tokens/module.modes.json` → `module.themes.json`. Generated file `styles/src/generated/modeTokensData.ts` → `themeTokensData.ts`. Build scripts updated in lockstep.
3. **The `Theme` export collision is resolved by renaming nice-styles' current `Theme` export to `Colors`.** The current `Theme` is a styled-components-bound *object* — a spread of token data passed to `<ThemeProvider theme={Theme}>` at `react-styles/src/components/StylesProvider/StylesProvider.tsx:149`. It carries colors plus core/breakpoint primitives, but its central purpose is making token values reachable as `props.theme` in styled-components. Renaming it to `Colors` is technically a narrowing (the object holds more than colors) but it's the closest single-word name that won't collide with the renamed `<Mode>` component (which becomes `<Theme>`) or the new `theme` prop. The whole-object name is the least precious of the three.
4. **No deprecation alias period.** No consumers exist above the platform — every consumer is inside `~/nice/`. The rename runs as one workspace-wide refactor PR. No `mode`/`Mode`/`ModeType` aliases need to be temporarily re-exported.
5. **`getInvertedMode` is dropped, not renamed.** Its only call site outside `react-button` is `website/src/components/Header/MenuDropdown.tsx`. The logic inlines into both call sites; the export goes away entirely.
6. **The rename covers every Nice-defined identifier whose substring includes `mode`/`Mode`/`modes` in the color-set-separation sense.** The inventory below reflects this — substring matches, not just full-word identifier matches.
7. **`day` and `night` values stay.** Variants like `dark`, `darker`, `lighter` already exist on the value side (e.g. `backgroundColor.dark`, `borderColor.darker`); renaming `day`/`night` to `light`/`dark` would either collide with those variants or require rethinking the whole variant naming. Out of scope.

---

## Inventory — every theming-sense `mode` identifier

All findings verified via grep across the workspace. Each entry is a Nice-defined identifier in the day/night theming concept that would need renaming.

### 1. Foundation types and constants — `nice-styles`

| File | Line | Identifier | Becomes |
|---|---|---|---|
| `styles/src/modeTypes.ts` (filename) | — | file `modeTypes.ts` | `themeTypes.ts` |
| `styles/src/modeTypes.ts` | 19 | `ModeType = "day" \| "night" \| (string & {})` | `ThemeType` |
| `styles/src/types/styleValues.ts` | 14 | `ModeValue` interface | `ThemeValue` |
| `styles/src/constants/styleValues.ts` | 4 | `DEFAULT_MODE = "day"` | `DEFAULT_THEME` |
| `styles/src/constants/styleValues.ts` | 15 | `STYLE_VALUE_KEYS.mode = [DEFAULT_MODE, "night"]` | `STYLE_VALUE_KEYS.theme` (key rename) |

### 2. Foundation services — `nice-styles`

| File | Identifier | Becomes |
|---|---|---|
| `styles/src/services/getModeToken.ts` (filename) | file | `getThemeToken.ts` |
| `styles/src/services/getModeToken.ts:19` | `getModeToken(group, item?, mode?)` | `getThemeToken(group, item?, theme?)` |
| `styles/src/services/getModeToken.ts:28` | `getModeTokenKey` | `getThemeTokenKey` |
| `styles/src/services/getModeToken.ts:37` | `getModeTokenValue` | `getThemeTokenValue` |
| `styles/src/services/setModeTokens.ts` (filename) | file | `setThemeTokens.ts` |
| `styles/src/services/setModeTokens.ts:20` | `setModeTokens(tokens)` | `setThemeTokens(tokens)` |
| `styles/src/services/getInvertedMode.ts` | entire file | **deleted** (per decision 5) |
| `styles/src/services/getComponentToken.ts:49,67,77,87` | `mode` parameter on `resolveComponentToken` + the `getComponentToken*` family | `theme` parameter |
| `styles/src/services/getConstant.ts:12-13,25,36,56` | `CssConstantOptions.mode` | `CssConstantOptions.theme` (passed in; emits `--{theme}` suffix value, which is still the literal `"day"` / `"night"` per decision 1) |

### 3. Registry — `nice-styles`

Internal but on the public-API path via `registerTokens`:

| File | Line | Identifier | Becomes |
|---|---|---|---|
| `styles/src/registry/index.ts` | 21 | `modes: new Set([DEFAULT_MODE])` | `themes: new Set([DEFAULT_THEME])` |
| `styles/src/registry/index.ts` | 30 | `data: modeTokensData` storage | `themeTokensData` |
| `styles/src/registry/index.ts` | 32 | `modesForEntry: new Set(Object.keys(modeTokensData))` | `themesForEntry` |
| `styles/src/registry/seedDimensionedTokens.ts` | 11 | `modesForEntry: Set<string>` parameter | `themesForEntry` |
| `styles/src/registry/registerTokens.ts` | 23 | mode-keyed collection from `ModeValue` variants | theme-keyed |

### 4. Utilities — `nice-styles`

| File | Line | Identifier | Becomes |
|---|---|---|---|
| `styles/src/utilities/isStyleValue.ts` | 5 | `mode: ModeValue` discriminator | `theme: ThemeValue` |
| `styles/src/utilities/getTokenFromMap.ts` | 49-50, 83, 111-112, 169 | `mode?: string` option + suffix-key handling | `theme?: string` |

### 5. Source token JSON — `nice-styles`

| File | Notes | Becomes |
|---|---|---|
| `styles/src/tokens/module.modes.json` | Top-level keys `"day"` and `"night"`; consumed by every build script that emits dimensional primitives | `module.themes.json` (filename change; the `"day"`/`"night"` keys *inside* the file stay per decision 7) |
| `styles/src/tokens/component.json` line 2 | Nested by theme dimension keys `"day"`/`"night"` | (no filename change; just internal docs/comment updates if any) |

### 6. Generated files — `nice-styles/src/generated/`

| File | Identifier | Becomes |
|---|---|---|
| `modeTokensData.ts` (filename) | file | `themeTokensData.ts` |
| `modeTokensData.ts:11` | `export type ModeTokensData` | `ThemeTokensData` |
| `modeTokensData.ts:13-60` | `const modeTokensData` | `themeTokensData` |

### 7. Build scripts — `nice-styles/scripts/`

| File | References |
|---|---|
| `generateTokens/index.ts:20,28,54` | `module.modes.json` path, watch-mode references, `modeTokensData.ts` output |
| `generateTokens/readSources.ts:21,44` | Reads `module.modes.json` as `DimensionMap` keyed by mode → keyed by theme |
| `generateTokens/writeData.ts:66-74` | `writeModeTokens()` → `writeThemeTokens()` |
| `generateTypes/index.ts:13,20,49` | `module.modes.json` references for type generation |
| `generateTypes/readSources.ts:38-50` | `modesDay`, `modesJson.night` local variables → `themesDay`, `themesJson.night` |
| `generateCss/readSources.ts:12,14,20,36,59-70` | Mode-keyed reads + night validation |
| `generateCss/writeCss.ts:11,36` | Output reference |
| `css/emitCoreTokens.ts:22-104` | `buildDayPrimitiveLine`, `buildNightPrimitiveLine` (these keep their day/night names; the variable they pass to `getConstantKey` becomes `{ theme: "day"|"night" }`) |
| `css/emitComponentTokens.ts:32,39` | Same pattern — component token day/night primitives |
| `css/assembleCombined.ts:5-157` | Assembles `@media (prefers-color-scheme: dark)` and `[data-theme="day"\|"night"]` — output stays exactly the same (per decision 1); only internal variable names tracked here change |

### 8. `nice-styles/src/index.ts` exports

| Line | Current export | Becomes |
|---|---|---|
| 52-54 | `getModeToken`, `getModeTokenKey`, `getModeTokenValue` | `getThemeToken*` |
| 59 | `setModeTokens` | `setThemeTokens` |
| 68 | `getInvertedMode` | **removed** |
| 74 | `DEFAULT_MODE` | `DEFAULT_THEME` |
| 93 | `ModeValue` | `ThemeValue` |
| 134 | `ModeType` | `ThemeType` |
| 138-140 | `modeTokensData` import; `Theme` object spread | `themeTokensData` import; **`Theme` export renamed to `Colors`** |

### 9. Context layer — `nice-react-styles`

| File | Identifier | Becomes |
|---|---|---|
| `react-styles/src/components/Mode/Mode.tsx` (filename) | folder + file | `Theme/Theme.tsx` |
| `react-styles/src/components/Mode/Mode.tsx:4` | `ModeProps { name: ModeType, … }` | `ThemeProps { name: ThemeType, … }` |
| `react-styles/src/components/Mode/Mode.tsx:47-48` | `<Mode>` → `<div data-theme={name}>` | `<Theme>` (output unchanged) |
| `react-styles/src/components/Mode/index.ts:1-2` | exports | retargeted to `Theme/` folder |
| `react-styles/src/components/StylesProvider/StylesProvider.tsx:9,149` | `import { Theme } from "nice-styles"` → `<ThemeProvider theme={Theme}>` | `import { Colors } from "nice-styles"` → `<ThemeProvider theme={Colors}>` |
| `react-styles/src/services/createTokens/index.ts:5,8` | `type ModeValue` in token map signature | `ThemeValue` |
| `react-styles/src/index.ts:7-8` | `export { Mode } from "./components/Mode"` | `export { Theme } from "./components/Theme"` |
| `react-styles/src/index.ts:23-25` | re-export `getModeToken*` | `getThemeToken*` |
| `react-styles/src/index.ts:30` | re-export `setModeTokens` | `setThemeTokens` |
| `react-styles/src/index.ts:38` | re-export `getInvertedMode` | **removed** |
| `react-styles/src/index.ts:47` | re-export `DEFAULT_MODE` | `DEFAULT_THEME` |
| `react-styles/src/index.ts:100` | re-export `ModeType` | `ThemeType` |

### 10. Component packages — every `nice-react-*` carrying the prop

The `mode?: ModeType` prop + corresponding `Types.Mode` namespace entry + any internal `<Mode>` wrap:

| Package | Prop site | Namespace entry | Internal touchpoints |
|---|---|---|---|
| `react-button` | `Button.types.ts:124` | `:164` (`ButtonTypes.Mode`) | `Button.tsx:23,38,93,104` — destructure, `getInvertedMode` call (becomes inlined), `<Mode>` wrap |
| `react-tile` | `Tile.types.ts:119`, `TileContent.types.ts:17`, `ContentMain.types.ts:11` | per-component namespace entries | `Tile.tsx:26,63`, `TileContent.tsx:14,31`, `ContentMain.tsx:18-53`, `TileLayout.tsx:17,50,66` |
| `react-input` | `Input.types.ts:289` | `:341` | passed through to styled component |
| `react-typography` | `Typography.types.ts:74` (`TypographyModeType` alias) | `:176` | passed through |
| `react-icon` | `Icon.types.ts:1,42` | (per-component) | passed through |
| `react-image` | `Image.types.ts:117` (`ImageModeType` alias), `:179`, `:213` | per-component | `Image.tsx:48,57` — `<Mode>` wrap |

`react-flex`, `react-scroll`, `react-slider`, `react-device-detector`, `react-lightbox` do **not** carry a `mode` prop today. Unaffected at the prop level; only their `ModeType` re-imports (if any) need updating.

Per-package `get{Component}Token*` getters take an optional `mode` argument (verified in `react-button/src/tokens/getButtonToken.ts:24,32,40`; same pattern in every other component package's tokens folder). All become `theme`.

### 11. Consumers — `storybook`, `website`, `website-viveka`

**Storybook config:**
- `storybook/.storybook/preview.tsx:5,12-17` — addon channel listener; the destination call `setAttribute("data-theme", ...)` stays as-is, but the imports change if the file mentions any Nice mode identifiers (currently it doesn't).
- `storybook/.storybook/preview.tsx:49,64` — story-sort entries `"1.2 · Modes"` and the `"Mode"` section label inside the React/Styles group → `"1.2 · Themes"`, `"Theme"`.
- `storybook/.storybook/main.ts:74` — `"storybook-dark-mode"` addon entry unchanged (third-party addon name).

**Storybook stories and MDX:**
- Every story file and MDX page that uses `<Mode>` or the `mode={...}` prop. Not enumerated here — too many — but a single grep for `(<Mode |mode=)` across `storybook/stories/` enumerates the surface.

**Website (`~/nice/website/`):**
- `src/App.tsx:4,58,68` — `<Mode className="..." name="day">` wrappers → `<Theme>`.
- `src/components/Header/MenuDropdown.tsx` — imports `getInvertedMode`. Drop the import; inline the inversion logic at the call site.
- `src/nice/Menu/Menu.types.ts`, `Menu.styles.ts`, `src/components/Tagline/Tagline.types.ts`, `src/components/FramedImage/FramedImage.types.ts`, `FramedImage.styles.ts`, `src/pages/Home/Tools/Tools.types.ts`, `src/pages/Home/Tool/Tool.types.ts` — all import `ModeType`. Rename imports and any in-code `mode` props they declare.

**Website-viveka:** mirrors `website/`'s pattern; same kind of grep yields the same shape of touchpoints.

### 12. Manifest documentation

| File | Touchpoints |
|---|---|
| `manifest/read/inheritance.md:47,76,79,82,83` | Mentions of `Mode` in context layer, `getModeToken*`, `setModeTokens`, `ModeValue`, `DEFAULT_MODE` |
| `manifest/read/styles/tokens.md:29-30,114` | CSS variable patterns with mode primitives — text update only (the CSS itself doesn't change per decision 1) |
| `manifest/edit/comments.md:43,62` | Code examples passing `mode: "day"` |
| `manifest/edit/component.md:213-217` | Component token getter examples with mode parameter |
| `manifest/.nice/reports/research/third-party-libraries.md:29` | Cross-cutting observation 2 mentions `getModeToken*` |
| `manifest/.nice/sessions/*.md` | Historical entries — **do not retroactively rename**; per session-log convention, sessions record what was true at the time |

---

## Non-theming "mode" usages — out of scope

These mean something different and must be left alone:

| Location | Meaning |
|---|---|
| `react-image/src/components/Image/Image.types.ts:7-13` (`ImageAsType`) | Rendering mode — `img` vs `div`. Separate from `ImageModeType` (the latter is in scope). |
| `react-image/src/components/Image/Image.tsx:65` (comment) | "Div mode: render background-image container" |
| `styles/scripts/*/index.ts` | "Watch mode" — file-watcher state during build |
| `manifest/read/audit.md:171` | "Debug mode" — localStorage/URL-param flag in device-detector |
| `manifest/edit/configuration.md:100,141` | TypeScript "strict mode", build "watch mode" settings |
| `storybook/.storybook/preview.tsx` | Storybook's own `viewMode: "docs"` / canvas UI switch |

Any blind find-and-replace would corrupt these.

---

## The `Theme` export collision in detail

`nice-styles` currently exports a value named `Theme`:

```ts
// styles/src/index.ts:140
export const Theme = { ...tokensData, ...modeTokensData.day, ...breakpointTokensData.small }
```

It's a flattened object passed to styled-components' `<ThemeProvider theme={Theme}>` at `react-styles/src/components/StylesProvider/StylesProvider.tsx:149` so styled components can read `props.theme.colorBaseDay` etc. There is exactly one import site (the StylesProvider) — verified via grep. styled-components' `useTheme` and `withTheme` are not used in any Nice source.

If we rename `<Mode>` → `<Theme>` without first renaming the existing `Theme` export, the same name would refer to two different things in `react-styles`: the value imported from nice-styles, and the local component being defined. Resolving this by aliasing on one side or the other (e.g. `import { Theme as ThemeTokens }`) is more confusing than picking a different name for one of them.

The least-precious of the two is the styled-components-bound object. It's already a bag of disparate token values, not a clean conceptual unit, and only one file imports it. Renaming to `Colors` is technically narrower than the object's contents (it carries breakpoint primitives too) but it's the closest single-word handle that doesn't collide. The single import in `StylesProvider.tsx` updates, and the renamed `Theme` component takes the prime name.

---

## Risks

1. **Mechanical risk: dropping `mode` from an identifier that shouldn't change.** The non-theming list above is the guardrail. Any rename script must be identifier-aware, not character-aware.
2. **Generated files.** `modeTokensData.ts` is auto-generated. Renaming its emitted filename + type name has to happen in the generator scripts first; then a rebuild produces the new file; then consumers reference it. Best done in one PR with the rebuild step explicitly performed before consumer updates land in the same diff.
3. **JSDoc and inline comments.** Mechanical to update. The risk is leaving stale references — exactly the case `manifest/read/audit.md` exists to catch.
4. **Session log and historical reports.** Per the manifest's session-log convention, historical entries record what was true at a point in time. The rename PR should add a current-session entry pointing future readers to the renamed identifiers, but leave historical text intact.
5. **External addons.** `storybook-dark-mode` will still emit `light`/`dark` and the bridge in `preview.tsx` still translates to `day`/`night`. No behavior change there.
6. **`Colors` is a slight misnomer.** The renamed object contains breakpoint values too. Acceptable — it's the cleanest single-word name available and the styled-components consumption path doesn't read those other values today (verified: no `props.theme.breakpoint*` usage in Nice sources).
7. **Refactor-safety rule.** Per `manifest/discipline/refactor-safety.md`, every save must compile. The duplicate-before-delete pattern applies: add `themeTokensData.ts` alongside `modeTokensData.ts`, migrate consumers, then delete the old. Same for `getThemeToken`/`getModeToken`. The PR can be one logical change but should be authored as a sequence of compiling commits.

---

## Estimated blast radius

| Layer | Files touched | Approximate lines |
|---|---|---|
| `nice-styles` source (types, services, constants, registry, utilities, exports) | ~18 files | ~250 |
| `nice-styles` build scripts | ~9 files | ~100 |
| `nice-styles` generated files | regenerated, not hand-edited | — |
| `nice-styles` token JSON | 1 file rename + content untouched | minimal |
| `nice-react-styles` (Mode→Theme component, StylesProvider, re-exports, createTokens) | ~5 files | ~50 |
| Component packages (6 of them, prop + namespace + internal wrap) | ~14 files | ~70 |
| Storybook (preview.tsx labels, every story/MDX using `<Mode>` or `mode=`) | preview.tsx + many story/MDX files | ~80-150 |
| Website (`~/nice/website/`) | ~10 files including the `getInvertedMode` inlining | ~30 |
| Website-viveka | similar shape; estimate from grep before starting | ~10-20 |
| Manifest docs | ~6 files | ~30 |

CSS output (`dist/tokens.css`): **unchanged**. The CSS suffix decision means consumers' hand-written CSS keeps working.

---

## What this report does NOT cover

- Specific commit sequencing for the rename PR. That's a follow-up plan.
- Whether the breakpoint dimension (`phone`/`tablet`/`laptop`/`desktop`) needs an analogous renaming pass. Out of scope; potentially worth a sibling report.
- Migration timing relative to in-flight work in any single package — coordinate at plan time.
- Whether `Colors` should later be revisited (e.g. split into separate exports for colors vs core vs breakpoints). Out of scope here.