# Token Naming Conventions

Design token naming patterns in nice-styles.

---

## CSS Variable Pattern

```
--np--{group}--{item}
--np--{prefix}--{group}--{item}
```

| Segment | Format | Examples |
|---------|--------|----------|
| np | fixed namespace | always `np` |
| prefix | kebab-case (component only) | `button`, `icon`, `tile`, `ink` |
| group | kebab-case | `font-size`, `color`, `border-radius` |
| item | kebab-case | `base`, `large`, `primary-hover` |

**Double dashes (`--`) separate segments. Single dashes within segments for compound words.**

### Core Token Examples

```
--np--font-size
--np--color--link
--np--border-radius--larger
--np--background-color--day      (mode primitive)
--np--color--night     (mode primitive)
```

### Component Token Examples

```
--np--button--size
--np--button--status-primary-base--background-color
--np--icon--color--error
--np--ink--font-size--larger
```

---

## TypeScript Naming

### Token Groups (camelCase)

```ts
getToken("fontSize")
getToken("color")
getToken("borderRadius")
```

### Token Items (camelCase or kebab)

For `getToken`, the variant is the second positional argument (default
`"base"`); theme / inverse / pristine stay in the trailing options object.
(`getTokenKey` / `getTokenValue` keep the variant inside their options object.)

```ts
getToken("fontSize", "base")
getToken("fontSize", "large")
getToken("color", "link")
```

### Type Names (PascalCase + Type suffix)

```ts
FontSizeType        // "smaller" | "small" | "base" | "large" | "larger"
ColorType // "lighter" | "light" | "medium" | ... | "error"
BorderRadiusType    // "smaller" | "small" | "base" | "large" | "larger"
ComponentPrefix     // "button" | "icon" | "tile" | "ink" (auto-generated)
```

---

## Token Groups

| Group | CSS Name | Items |
|-------|----------|-------|
| `animationDuration` | `animation-duration` | base, slow |
| `animationEasing` | `animation-easing` | base |
| `backgroundColor` | `background-color` | base, dark, success, warning, error, link (+ `$inverse` — see Inverse Colors) |
| `backgroundSize` | `background-size` | contain, cover, fill, none, scale-down |
| `borderColor` | `border-color` | base, dark, darker |
| `borderRadius` | `border-radius` | smaller, small, base, large, larger |
| `borderWidth` | `border-width` | base, large |
| `boxShadow` | `box-shadow` | base, large |
| `cellHeight` | `cell-height` | smaller, small, base, large, larger |
| `fontFamily` | `font-family` | base, code, heading |
| `fontSize` | `font-size` | smaller, small, base, large, larger |
| `fontWeight` | `font-weight` | light, base, medium, semibold, bold, extrabold, black |
| `color` | `color` | base, light, lighter, lightest, disabled, link, success, warning, error (+ `$inverse` — see Inverse Colors) |
| `gap` | `gap` | none, smaller, small, base, large, larger |
| `lineHeight` | `line-height` | condensed, base, expanded |
| `zIndex` | `z-index` | base, low, medium, high, higher |

---

## Inverse Colors

The inverse of a color is the **opposite theme's** value — in day mode the night
color, in night mode the day color. `color` and `backgroundColor` carry an inverse
for every variant.

**Data — the `$inverse` reserved key.** Inverse values live inside the base
module (`color.json` / `backgroundColor.json`) under a reserved `$inverse` key,
a sibling of `$themes` / `$breakpoints`. It is a self-contained sub-module —
base (day) variants plus its own `$themes.night` — holding the swapped values:

```jsonc
// modules/color.json
{
  "base": "hsla(210,5%,5%,1)", …,                 // color day
  "$themes": { "night": { "base": "hsla(210,5%,95%,1)", … } },
  "$inverse": {
    "base": "hsla(210,5%,95%,1)", …,              // inverse day  = color night
    "$themes": { "night": { "base": "hsla(210,5%,5%,1)", … } }  // inverse night = color day
  }
}
```

There are **no** `colorInverse` / `backgroundColorInverse` modules — inverse is a
dimension of the base group, not a separate group.

**Var structure — `inverse` is a trailing `--inverse` segment** (a plain
double-dashed segment after the theme, *not* a camelCase fusion):

```
--np--color--inverse          semantic (reactive — flips with the theme)
--np--color--day--inverse     day primitive   = color night value
--np--color--night--inverse   night primitive = color day value
```

The semantic `--np--color--inverse` flips via `@media (prefers-color-scheme:
dark)` and `[data-theme]` pins exactly like a normal token, so a region styled with
the inverse pair renders as the opposite theme **without** a JS `data-theme`
wrapper, and it doesn't break when more themes are added.

**Seeded as string literals, not `var()`** — `$inverse.base` (day) is the literal
`hsla(210,5%,95%,1)`, not `var(--np--color--night)`. Inverse colors usually
need per-variant tweaking, so each is an editable value. Keep them hand-synced
with `color` / `backgroundColor`, or tweak freely.

**Reading an inverse:** the `inverse` option on the getter —
`getToken("color", undefined, { inverse: true })` → `var(--np--color--inverse)`,
`getToken("backgroundColor", "error", { inverse: true })`. Valid for
`color` / `backgroundColor` only (throws on groups with no `$inverse`). The
generated `{Group}InverseType` (`ColorInverseType`, …) is the inverse variant union.

**Adding a 3rd theme:** add a `$themes.{name}` entry inside each `$inverse` block
with the inverse you want for that theme — there is no automatic opposite beyond
day↔night.

---

## Size Scale Pattern

Standard size progression:

```
smaller → small → base → large → larger
```

Used by: `borderRadius`, `cellHeight`, `fontSize`, `gap`

---

## Token Source Files

JSON sources split into two scopes — module-level (cross-component) under `modules/`, and component-level (per-prefix) under `components/`. Both scopes are **folders of one-file-per-key**: `modules/{group}.json` (one per token group) and `components/{prefix}.json` (one per component). Breakpoint and alt-theme overrides live **inside** each file under the reserved `$breakpoints` and `$themes` keys.

```
nice-styles/src/tokens/
├── modules/                     ← one file per token group
│   ├── color.json               ← base + $themes (alt themes inline)
│   ├── backgroundColor.json
│   ├── borderColor.json
│   ├── fontSize.json            ← $breakpoints only (no top-level base)
│   ├── gap.json
│   ├── borderRadius.json
│   └── …                        ← one per group (18 today)
├── breakpoints.json             ← breakpoint pixel thresholds (separate concern)
└── components/
    ├── button.json              ← per-component base + $themes (alt themes inline)
    ├── icon.json
    ├── image.json
    ├── input.json
    ├── lightbox.json
    ├── tile.json
    └── ink.json
```

Key order inside each file mirrors the CSS cascade so the JSON reads top-to-bottom in the same direction styles resolve:

1. **Base groups** (e.g. `color`, `fontSize`, `gap`) — the unconditional default.
2. **`$breakpoints`** — viewport-conditional overrides, keyed by breakpoint name (`tablet`, `laptop`, `desktop`).
3. **`$themes`** — user-preference overrides, keyed by alt-theme name (`night`, …).

Themes are emitted last in `dist/tokens.css`, so on overlap (a token overridden by both a breakpoint and a theme) the theme wins — matching the existing canonical pattern of placing `prefers-color-scheme: dark` after `min-width` media queries.

### Module-level files

- **`modules/{group}.json`** — one file per cross-component token group; the filename stem is the group name (`color.json` → `color`). Top-level keys are that group's base variants, with reserved `$breakpoints` (keyed by breakpoint name) and `$themes` (keyed by alt-theme name) holding overrides **scoped to that group**:
  ```json
  // modules/color.json
  {
    "base":  "hsla(210, 5%, 5%, 1)",
    "light": "hsla(210, 5%, 25%, 1)", ...,
    "$themes": {
      "night": { "base": "hsla(210, 5%, 95%, 1)", "light": "...", ... }
    }
  }
  ```
  ```json
  // modules/fontSize.json — purely breakpoint-driven; no top-level base
  {
    "$breakpoints": {
      "phone":   { "smaller": "11px", "base": "14px", ... },
      "tablet":  { ... },
      "laptop":  { "smaller": "12px", "base": "16px", ... },
      "desktop": { ... }
    }
  }
  ```
  Each `$themes` / `$breakpoints` entry is partial — only the variants that differ. A theme override MUST NOT introduce a variant absent from the group's base; the base is the registration site. The exception is a **purely breakpoint-driven group** like `fontSize`, which carries no top-level base — its `phone` dimension *is* the default (`phone` is the implicit default breakpoint).

  **Adding a token group = drop one `modules/{group}.json`.** The build globs the folder — no script edits. Same philosophy as `components/`.
- **`breakpoints.json`** pixel-threshold table for the breakpoint names (a separate concern from breakpoint-conditional token values — this file defines *when* a breakpoint is active, not *which tokens* it overrides).

### Component-level files

- **`components/{prefix}.json`** holds the comprehensive base for one component prefix at the top level. Token values are raw CSS strings; cross-references use `var()`. Alternative themes live under the same reserved `$themes` key as module-level files:
  ```json
  {
    "size":         { "smaller": "var(--np--cell-height--smaller)", ... },
    "borderRadius": { ... },
    "status":       { "primary": { "base": { ... }, "disabled": { ... }, ... } },
    "$themes": {
      "night": {
        "status": { "primary": { ... } }
      }
    }
  }
  ```
  Components with no alt-theme overrides (icon, tile, ink, image, input, lightbox today) simply omit the `$themes` key.

  **Components support `$breakpoints` too** — the same reserved key modules use, with each breakpoint holding a partial mirror of the (nested) base tree. So both axes are available in both scopes:

  ```json
  {
    "size": { "base": "var(--np--cell-height)", ... },
    "$breakpoints": {
      "laptop": { "size": { "base": "var(--np--cell-height--large)" } }
    },
    "$themes": {
      "night": { "status": { "primary": { ... } } }
    }
  }
  ```

  Each `$breakpoints` / `$themes` entry is partial — only the paths that differ from the base. A `night` theme is special (it is the OS dark default, see Theme Architecture); any other `$themes` name and every `$breakpoints` name validate against the base tree and emit pin / `min-width` overrides.

Adding a new component package = drop one `components/{prefix}.json`. The build picks it up automatically via filename glob — no script edits.

#### Component alias auto-propagation (theme / breakpoint reactivity)

A component token whose value is a **bare alias** to a core token —
`"light": "var(--np--color--light)"` — automatically tracks every scope the
referenced core participates in. The generator (`scripts/css/emitComponentAliases.ts`)
emits a parallel reassignment of the component var into each
`[data-theme="day"]` / `[data-theme="night"]` pin, the
`@media (prefers-color-scheme: dark)` block, and any `@media (min-width)`
breakpoint block, pointing at the core's stable primitive
(`var(--np--color--light--night)`, `var(--np--font-size--laptop)`, …). No new
primitives are minted — it reuses the core's.

**Why it exists:** a component alias declared only at `:root` freezes its
`var()` at `:root` scope (CSS custom-property substitution), so a
`[data-theme="night"]` pin — which reassigns the *core* token, not the
component token — never reaches it. The component color would silently follow
`:root`/OS instead of the pin. Auto-propagation closes that gap so **every
component token is theme- and breakpoint-correct without per-file authoring**.

**Precedence:** authored `$themes.{theme}` / `$breakpoints.{bp}` overrides win
per-variant — the auto pass skips any path+scope an authored override owns, so
partial authoring composes (authored variants use the authored value, the rest
auto-propagate). Component tokens holding a **distinct literal** value (e.g.
button `status` colors) have no core counterpart to derive from and so still
require authored `$themes` to theme — that path is unchanged.

**Convention:** component styles should resolve through their own component
token (`get{Component}Token`), never a core/root `getToken` var directly. Core
vars are for loose use in consumer/app code. Because aliases now auto-propagate,
routing a component prop through its component token is always theme-correct.

### Auto-Generated Files

Build scripts (`scripts/generate*/`) read the JSON sources and output:

```
nice-styles/src/generated/
├── types.ts                       ← token type unions, ComponentPrefix
├── tokensData.ts                  ← static core tokens as TS object
├── themeTokensData.ts             ← theme-keyed tokens as TS object ({day, night})
├── breakpointTokensData.ts        ← breakpoint-keyed tokens as TS object
├── componentTokensData.ts         ← component tokens (day branch) as TS object
└── breakpointsData.ts             ← pixel thresholds
```

The generators reconstitute the `{day, night}` split for runtime consumption — `themesData.day` is computed by splitting the `modules/` themed groups out of the base. Runtime registry and CSS emission both still address the base theme as `"day"`; the JSON layer alone elides the wrapper.

---

## Import Guidance

In React projects, import all nice-styles assets from `nice-react-styles`, which re-exports the entire nice-styles public API. Import directly from `nice-styles` only when working outside the React framework (e.g., vanilla JS, build scripts, non-React tooling). Either import path is valid — they resolve to the same functions.

```ts
// React projects
import { getToken, getBreakpoint, type FontSizeType } from "nice-react-styles"

// Non-React contexts
import { getToken, getBreakpoint, type FontSizeType } from "nice-styles"
```

---

## getToken

Unified token accessor. Reads from the runtime registry (seeded at module load from the generated token data, runtime-extensible via `setTokens`). Throws on unknown tokens.

The token name is always positional. For `getToken` the `variant` is the
second positional argument (default `"base"`); `theme` / `inverse` / `pristine`
stay in a trailing options object. `getTokenKey` / `getTokenValue` keep the
variant inside their options object. Three sibling functions cover the three
accessor forms:

- `getToken(name, variant?, options?)` — `var(--np--…)` reference (the common case).
- `getTokenKey(name, options?)` — bare CSS variable name (no `var(...)` wrapper).
- `getTokenValue(name, options?)` — raw underlying value (e.g. `"16px"`).

`getToken` options: `{ theme?: string; inverse?: boolean; pristine?: boolean }`.
`getTokenKey` / `getTokenValue` options: `{ variant?: string; theme?: string; inverse?: boolean; pristine?: boolean }`.

```ts
import { getToken, getTokenKey, getTokenValue } from "nice-react-styles"

getToken("fontSize")                            // → "var(--np--font-size)"  (base default)
getToken("fontSize", "large")                   // → "var(--np--font-size--large)"
getTokenKey("fontSize", { variant: "base" })    // → "--np--font-size"
getTokenValue("fontSize", { variant: "base" })  // → "16px"

// Theme-pinned primitive
getToken("color", "base", { theme: "night" })            // → "var(--np--color--night)"

// Inverse color (color / backgroundColor only) — trailing --inverse segment
getToken("backgroundColor", undefined, { inverse: true }) // → "var(--np--background-color--inverse)"
```

### Usage in styled-components

```ts
import { getToken } from "nice-react-styles"

const StyledDiv = styled.div`
  font-size: ${getToken("fontSize", "large")};
  color: ${getToken("color", "light")};
`
```

---

## getConstant (nice-styles)

Constructs CSS variable strings following the `--np--` convention. Does not look up values.

### Signature

```ts
getConstant(token: string, param: string, options?: { theme?: string; breakpoint?: string; pkg?: string; inverse?: boolean }): CssConstantResult
```

### Examples

```ts
import { getConstant } from "nice-react-styles"

// Core token
getConstant("backgroundColor", "base")
// → { key: "--np--background-color", var: "var(--np--background-color)" }

// Force day theme primitive
getConstant("backgroundColor", "base", { theme: "day" })
// → { key: "--np--background-color--day", var: "var(--np--background-color--day)" }

// Force night theme primitive
getConstant("color", "base", { theme: "night" })
// → { key: "--np--color--night", var: "var(--np--color--night)" }

// Component token
getConstant("height", "small", { pkg: "button" })
// → { key: "--np--button--height--small", var: "var(--np--button--height--small)" }
```

**Always use getConstant for CSS variable strings. Never construct manually.**

---

## getComponentToken (nice-styles)

Component-scoped token accessor. Reads from auto-generated component token data.

### Signature

Only the component `prefix` is positional; everything else is in the options
object. `token` may be a string (flat lookup) or a path array (nested lookup).

```ts
getComponentToken(
  prefix: ComponentPrefix,  // "button" | "icon" | "tile" | "ink" | …
  options: {
    token: string | string[]  // token name, or a path array for nested tokens
    variant?: string          // flat lookups only; defaults to "base"
    theme?: string             // theme/mode pin (e.g. "night")
  }
): string
```

`getComponentTokenKey` and `getComponentTokenValue` are sibling functions returning the bare name and raw value respectively, mirroring the `getToken` family pattern.

### Examples

```ts
import { getComponentToken } from "nice-react-styles"

getComponentToken("button", { token: "size", variant: "base" })
// → "var(--np--button--size)"

getComponentToken("icon", { token: "color", variant: "error" })
// → "var(--np--icon--color--error)"

// Nested path lookup
getComponentToken("button", { token: ["status", "primary", "backgroundColor", "base"] })
// → "var(--np--button--status--primary--background-color)"
```

TypeScript enforces valid prefixes via `ComponentPrefix` (auto-generated from `src/tokens/components/*.json` filenames).

---

## Token Registry (nice-react-styles)

Runtime token registry that extends nice-styles' static tokens. Core tokens are available immediately; custom tokens are registered via `setTokens()` or `registerTokens()`.

### getToken (nice-react-styles) — Unified Token Accessor

Queries the runtime registry. Core tokens work immediately. Custom tokens available after registration.

```ts
import { getToken } from "nice-react-styles"

// Core tokens (always available)
getToken("fontSize", "base")   // → --np--font-size
getToken("color", "link")       // → --np--color--link

// Theme-specific primitives
getToken("backgroundColor", "base", { theme: "day" })    // → --np--background-color--day
getToken("backgroundColor", "base", { theme: "night" })  // → --np--background-color--night

// Custom tokens (after registration)
getToken("brandColor", "primary")   // → --np--brand-color--primary
```

### setTokens — Register + Generate CSS

Registers app-level token overrides and custom tokens in the runtime registry. Injects the generated CSS synchronously at call time; returns nothing. Call it once at module load (typically in `src/nice/tokens.ts`) and import that file for its side effect from your app entry.

```ts
import { setTokens, getToken } from "nice-react-styles"

const AppTokenMap = {
  // Override core tokens
  fontSize: { base: "20px", larger: "40px" },

  // Custom tokens
  brandColor: { primary: "#dc0000" },

  // Theme-aware tokens
  headerColor: {
    base: { day: "#000", night: "#fff" },
  },
} as const

setTokens(AppTokenMap)
export { getToken }
```

**Generated CSS:**
```css
:root {
  --np--font-size: 20px;
  --np--font-size--larger: 40px;
  --np--brand-color--primary: #dc0000;
  --np--header-color: #000;
  --np--header-color--night: #fff;
}
@media (prefers-color-scheme: dark) {
  :root {
    --np--header-color: var(--np--header-color--night);
  }
}
```

### registerTokens — Manual Registration

Directly register tokens without generating CSS.

```ts
import { registerTokens } from "nice-react-styles"

registerTokens({ brandColor: { primary: "#f00" } }, "app")
```

**Merge behavior:** Variants are merged, not replaced. Partial overrides preserve existing variants.

### Direct registry access

The registry itself is exported as a `Map<string, RegistryEntry>` for callers that need lookup or enumeration:

```ts
import { registry } from "nice-react-styles"

registry.has("fontSize")         // true
registry.has("brandColor")       // true (after registerTokens / setTokens)
[...registry.keys()]             // ["fontSize", "color", "gap", ...]
```

---

## Token Source Modules (nice-styles)

Token values originate from per-group JSON files under `nice-styles/src/tokens/modules/` — one file per token group, each carrying the comprehensive base at its top level plus inline `$breakpoints` and `$themes` override sections **scoped to that group**. A shared reader (`scripts/shared/readModuleFolder.ts`) globs the folder and reassembles the combined object the build consumes. Per-component tokens live under `components/{prefix}.json` with the same internal shape.

### modules/{group}.json — Base + `$breakpoints` + `$themes`

Each file's top-level keys hold the group's base variants: static groups (`gap`, `borderRadius`, …) carry their values directly; theme-conditional groups (`color`, `backgroundColor`, `borderColor`) carry their default-theme values. Two reserved override sections may follow, scoped to that group:

- **`$breakpoints`** — keyed by `phone` / `tablet` / `laptop` / `desktop`. `phone` is the implicit default; higher breakpoints override via `min-width` media queries.
- **`$themes`** — keyed by alternative theme name (`night`, …). Partial — only the variants that differ from the base.

```json
// modules/gap.json — static group, no overrides
{ "none": "0", "smaller": "4px", "small": "8px", "base": "16px" }
```
```json
// modules/color.json — theme-conditional group
{
  "base": "hsla(210, 5%, 5%, 1)", "light": "hsla(210, 5%, 25%, 1)", …,
  "$themes": {
    "night": { "base": "hsla(210, 5%, 95%, 1)", "light": "hsla(210, 5%, 95%, 0.85)", … }
  }
}
```
```json
// modules/fontSize.json — breakpoint-driven; no top-level base, phone is the default
{
  "$breakpoints": {
    "phone":   { "base": "14px" },
    "laptop":  { "base": "16px" },
    "desktop": { "base": "18px" }
  }
}
```

```css
:root {
  --np--gap--none: 0;
  --np--font-size: 14px;
  --np--color: hsla(210, 5%, 5%, 1);
  --np--color--day: hsla(210, 5%, 5%, 1);
  --np--color--night: hsla(210, 5%, 95%, 1);
}
@media (min-width: 1280px) {
  :root { --np--font-size: var(--np--font-size--laptop); }
}
@media (min-width: 1720px) {
  :root { --np--font-size: var(--np--font-size--desktop); }
}
@media (prefers-color-scheme: dark) {
  :root { --np--color: var(--np--color--night); }
}
```

JSON key order within each file mirrors CSS cascade order: `base → $breakpoints → $themes`. On overlap (a token overridden by both a breakpoint and a theme), the theme wins by source-order precedence — matching the canonical pattern of placing `prefers-color-scheme: dark` after `min-width` media queries.

A theme override MUST NOT introduce a variant absent from the group's base — the generator validates night against day and throws on orphan overrides; the base is the registration site for every variant a theme can address. The exception is a purely breakpoint-driven group (`fontSize`), which carries no top-level base — its `phone` dimension *is* the default.

### Build Pipeline

Three readers consume the source JSON. Module-level files are discovered via a `modules/*.json` glob and reassembled into the combined shape by the shared `readModuleFolder` reader; per-component files via a `components/*.json` glob. **Both scopes are zero-script-edit — adding a token group or a component package is just a new file.** Both `$breakpoints` and `$themes` overrides are always inline under the parent file — no sibling `module.breakpoints.json` or `.themes.json` files exist.

| Script | Reads | Outputs |
|--------|-------|---------|
| `scripts/generateTokens/` | glob `modules/*.json` (each incl. `$breakpoints` + `$themes`), `breakpoints.json`, glob `components/*.json` (each incl. `$themes`) | `src/generated/tokensData.ts`, `themeTokensData.ts`, `breakpointTokensData.ts`, `componentTokensData.ts`, `breakpointsData.ts` |
| `scripts/generateCss/` | same set | `dist/tokens.css`, `dist/css/{group}.css` |
| `scripts/generateTypes/` | same set, just enough to derive type unions | `src/generated/types.ts` |

The legacy `{day, night}` shape used by the runtime registry and the generated `themeTokensData.ts` is reconstituted at read time: themed groups (those that appear in any alt theme inside `$themes`) are split out of the reassembled `modules/` base to compute `themesDay`; `$themes.night` (etc.) is passed through unchanged. The breakpoint data is read from `$breakpoints` directly into the same shape that `module.breakpoints.json` previously held.

Merge strategy in CSS generation: `{ ...coreTokens, ...themesDay, ...breakpointsPhone }` — later keys win on collision. This merged map drives the semantic `:root` variables.

---

## Variant Value Formats in setTokens

When calling `setTokens()` from nice-react-styles, variant values can be one of three formats. These can be mixed freely within the same token group.

### Static (string)

```ts
{ gap: { none: "0", base: "32px" } }
```

### Responsive (breakpoint object)

Detected by `isBreakpointValue()` — checks for `phone` key.

```ts
{ gap: { base: { phone: "24px", laptop: "32px" } } }
```

Generates a phone-first default + breakpoint primitives + media query reassignment.

### Theme-aware (theme object)

Detected by `isThemeValue()` — checks for `day` key. Checked after breakpoint (if an object has both `phone` and `day`, breakpoint wins).

```ts
{ headerColor: { base: { day: "#000", night: "#fff" } } }
```

Generates semantic variable + day/night primitives + `prefers-color-scheme` media query.

### Mixed Example

```ts
setTokens({
  gap: {
    none: "0",                                  // static
    base: { phone: "24px", laptop: "32px" },    // responsive
  },
  headerColor: {
    base: { day: "#000", night: "#fff" },       // mode-aware
    accent: "#dc0000",                          // static
  },
})
```

---

## Theme Architecture

- **"day"** is the default theme (`DEFAULT_THEME` in nice-react-styles)
- **"night"** replaces "dark" for mode suffixes throughout the system
- Stable primitives: `--np--*--day` and `--np--*--night` are never reassigned
- `@media (prefers-color-scheme: dark)` maps semantic vars to `--night` primitives — this is the **default behavior** when no pin is set
- `color-scheme: light dark` on `:root` enables native browser dark scheme

### Arbitrary theme names

`night` is not the only possible theme — it is the **single theme wired to `@media (prefers-color-scheme: dark)`** (the OS dark default). Any *other* name under a `$themes` key (module or component), e.g. `sepia`, emits a stable `--np--…--{name}` primitive plus a `[data-theme="{name}"]` pin block, and is activated **only** by an explicit pin (`<Theme name="sepia">` / `data-theme="sepia"`) — there is no OS auto-switch for extra themes, since only one theme can own `prefers-color-scheme: dark`. Extra themes validate against the day base like night does. This is additive: the day/night path is unchanged.

### Pinning a region to a specific mode

`tokens.css` also emits two attribute-selector blocks that override the OS-preference cascade:

```css
[data-theme="day"]   { color-scheme: light; --np--color: var(--np--color--day);   /* …all mode vars */ }
[data-theme="night"] { color-scheme: dark;  --np--color: var(--np--color--night); /* …all mode vars */ }
```

The attribute selector outranks `@media (prefers-color-scheme: dark)`, so when `data-theme` is set on an element the pin wins. The reassignments cascade to every descendant — nice components, raw markup, third-party widgets that read `var(--np--…)` alike.

Three ways consumers pin:

| Approach | Code | Use when |
|---|---|---|
| Whole page | `<html data-theme="day">` | App-wide default that overrides OS preference (e.g. storybook). |
| Subtree via React | `<Theme name="day">{children}</Theme>` from `nice-react-styles` | Pin a region; uses a `<div style="display:contents">` so layout is unaffected. |
| Subtree via raw HTML | `<section data-theme="day">…</section>` | Same mechanism without React. |

### Component `theme` prop

Visual components (Ink, Tile, Button, Icon, Image, Input) implement their `theme` prop by wrapping their rendered output in `<Theme name={theme}>` when the prop is set. Consequences:

- Descendants of `<Tile theme="night">` automatically inherit night via the cascade — no need to set `theme` on each child.
- A child with its own `theme` prop pins itself (and its descendants), overriding the ancestor.
- Internal styled-components do **not** thread `$theme`; they reference semantic vars and rely on the cascade.

### Escape hatch — explicit primitive

The `theme` option on `getToken(name, variant, { theme })` returns the bare mode-primitive reference (`var(--np--…--day)` or `--night`) — bypassing the cascade entirely. Use only when an element inside a pinned region needs the opposite mode regardless of any ancestor pin (e.g. Button's inverted-mode text contrast).

### ThemeType (nice-styles)

Core type for theme props across the ecosystem. Extensible for consumer-defined custom themes.

```ts
import type { ThemeType } from "nice-react-styles"
// "day" | "night" | (string & {})
```

Component packages re-export as component-specific aliases:

```ts
// nice-react-ink
import type { InkThemeType } from "nice-react-ink"
// InkThemeType = ThemeType
```

Higher-level components (app code, wrapper components) import `ThemeType` from nice-react-styles:

```ts
import type { ThemeType } from "nice-react-styles"

interface MyComponentProps {
  theme?: ThemeType
}
```
