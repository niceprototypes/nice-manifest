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
| prefix | kebab-case (component only) | `button`, `icon`, `tile`, `typography` |
| group | kebab-case | `font-size`, `color`, `border-radius` |
| item | kebab-case | `base`, `large`, `primary-hover` |

**Double dashes (`--`) separate segments. Single dashes within segments for compound words.**

### Core Token Examples

```
--np--font-size--base
--np--color--link
--np--border-radius--larger
--np--background-color--base--day      (mode primitive)
--np--color--base--night     (mode primitive)
```

### Component Token Examples

```
--np--button--size--base
--np--button--status-primary-base--background-color
--np--icon--color--error
--np--typography--font-size--larger
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
ComponentPrefix     // "button" | "icon" | "tile" | "typography" (auto-generated)
```

---

## Token Groups

| Group | CSS Name | Items |
|-------|----------|-------|
| `animationDuration` | `animation-duration` | base, slow |
| `animationEasing` | `animation-easing` | base |
| `backgroundColor` | `background-color` | base, alternate |
| `backgroundSize` | `background-size` | contain, cover, fill, none, scale-down |
| `borderColor` | `border-color` | base, dark, darker |
| `borderRadius` | `border-radius` | smaller, small, base, large, larger |
| `borderWidth` | `border-width` | base, large |
| `boxShadow` | `box-shadow` | base, large |
| `cellHeight` | `cell-height` | smaller, small, base, large, larger |
| `fontFamily` | `font-family` | base, code, heading |
| `fontSize` | `font-size` | smaller, small, base, large, larger |
| `fontWeight` | `font-weight` | light, base, medium, semibold, bold, extrabold, black |
| `color` | `color` | base, light, lighter, lightest, disabled, link, success, warning, error |
| `gap` | `gap` | none, smaller, small, base, large, larger |
| `lineHeight` | `line-height` | condensed, base, expanded |

---

## Size Scale Pattern

Standard size progression:

```
smaller → small → base → large → larger
```

Used by: `borderRadius`, `cellHeight`, `fontSize`, `gap`

---

## Token Source Files

### Core Tokens

```
nice-styles/src/tokens/core/
├── default/index.json    ← day/default values
└── night/index.json      ← night mode overrides
```

### Component Tokens

```
nice-styles/src/tokens/component/
├── button/index.json
├── icon/index.json
├── tile/index.json
└── typography/index.json
```

Component token values are raw CSS strings. Cross-references use `var()`:

```json
{
  "size": {
    "smaller": "var(--np--cell-height--smaller)",
    "small": "var(--np--cell-height--small)",
    "base": "var(--np--cell-height--base)"
  }
}
```

### Auto-Generated Files

Build scripts (`scripts/generate*.ts`) read the JSON sources and output:

```
nice-styles/src/generated/
├── types.ts                  ← token type unions, ComponentPrefix
├── tokensData.ts             ← core token values as TS object
└── componentTokensData.ts    ← component token values as TS object
```

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

Unified token accessor. Reads from the runtime registry (seeded at module load from the generated token data, runtime-extensible via `createTokens`). Throws on unknown tokens.

Three sibling functions cover the three accessor forms:

- `getToken(name, variant?, mode?)` — `var(--np--…)` reference (the common case).
- `getTokenKey(name, variant?, mode?)` — bare CSS variable name (no `var(...)` wrapper).
- `getTokenValue(name, variant?, mode?)` — raw underlying value (e.g. `"16px"`).

```ts
import { getToken, getTokenKey, getTokenValue } from "nice-react-styles"

getToken("fontSize", "base")          // → "var(--np--font-size--base)"
getTokenKey("fontSize", "base")       // → "--np--font-size--base"
getTokenValue("fontSize", "base")     // → "16px"

// Theme-pinned primitives
getToken("color", "base", "night")   // → "var(--np--color--base--night)"
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
getConstant(token: string, param: string, options?: { mode?: string; pkg?: string }): CssConstantResult
```

### Examples

```ts
import { getConstant } from "nice-react-styles"

// Core token
getConstant("backgroundColor", "base")
// → { key: "--np--background-color--base", var: "var(--np--background-color--base)" }

// Force day mode primitive
getConstant("backgroundColor", "base", { mode: "day" })
// → { key: "--np--background-color--base--day", var: "var(--np--background-color--base--day)" }

// Force night mode primitive
getConstant("color", "base", { mode: "night" })
// → { key: "--np--color--base--night", var: "var(--np--color--base--night)" }

// Component token
getConstant("height", "small", { pkg: "button" })
// → { key: "--np--button--height--small", var: "var(--np--button--height--small)" }
```

**Always use getConstant for CSS variable strings. Never construct manually.**

---

## getComponentToken (nice-styles)

Component-scoped token accessor. Reads from auto-generated component token data.

### Signature

```ts
getComponentToken(
  prefix: ComponentPrefix,  // "button" | "icon" | "tile" | "typography" | …
  tokenName: string,
  variant?: string,         // defaults to "base"
  mode?: string
): string
```

`getComponentTokenKey` and `getComponentTokenValue` are sibling functions returning the bare name and raw value respectively, mirroring the `getToken` family pattern.

### Examples

```ts
import { getComponentToken } from "nice-react-styles"

getComponentToken("button", "size", "base")
// → "var(--np--button--size--base)"

getComponentToken("icon", "color", "error")
// → "var(--np--icon--color--error)"
```

TypeScript enforces valid prefixes via `ComponentPrefix` (auto-generated from `src/tokens/component/` folder names).

---

## Token Registry (nice-react-styles)

Runtime token registry that extends nice-styles' static tokens. Core tokens are available immediately; custom tokens are registered via `createTokens()` or `registerTokens()`.

### getToken (nice-react-styles) — Unified Token Accessor

Queries the runtime registry. Core tokens work immediately. Custom tokens available after registration.

```ts
import { getToken } from "nice-react-styles"

// Core tokens (always available)
getToken("fontSize", "base")          // → --np--font-size--base
getToken("color", "link")   // → --np--color--link

// Theme-specific primitives
getToken("backgroundColor", "base", "day")    // → --np--background-color--base--day
getToken("backgroundColor", "base", "night")  // → --np--background-color--base--night

// Custom tokens (after registration)
getToken("brandColor", "primary")     // → --np--brand-color--primary
```

### createTokens — Register + Generate CSS

Registers app-level token overrides and custom tokens in the runtime registry. Injects the generated CSS synchronously at call time; returns nothing. Call it once at module load (typically in `src/nice/tokens.ts`) and import that file for its side effect from your app entry.

```ts
import { createTokens, getToken } from "nice-react-styles"

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

createTokens(AppTokenMap)
export { getToken }
```

**Generated CSS:**
```css
:root {
  --np--font-size--base: 20px;
  --np--font-size--larger: 40px;
  --np--brand-color--primary: #dc0000;
  --np--header-color--base: #000;
  --np--header-color--base--night: #fff;
}
@media (prefers-color-scheme: dark) {
  :root {
    --np--header-color--base: var(--np--header-color--base--night);
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
registry.has("brandColor")       // true (after registerTokens / createTokens)
[...registry.keys()]             // ["fontSize", "color", "gap", ...]
```

---

## Token Source Modules (nice-styles)

Token values originate from three JSON module files in `nice-styles/src/tokens/`. Each module has the same data pattern (token groups → variants → values) but a different condition structure that determines how the values are emitted as CSS.

### Module Files

| File | Condition | JSON Shape | Default |
|------|-----------|------------|---------|
| `module.json` | None (static) | `{ group: { variant: value } }` | Always active |
| `module.breakpoints.json` | Breakpoint | `{ breakpoint: { group: { variant: value } } }` | `phone` is default |
| `module.themes.json` | Theme | `{ theme: { group: { variant: value } } }` | `day` is default |

### module.json — Static Tokens

Flat key-value pairs. No conditions. Every variant produces one CSS variable in `:root`.

```json
{
  "gap": { "none": "0", "smaller": "4px", "small": "8px", "base": "16px" },
  "borderRadius": { "smaller": "2px", "small": "4px", "base": "8px" }
}
```

```css
:root {
  --np--gap--none: 0;
  --np--gap--smaller: 4px;
  --np--border-radius--base: 8px;
}
```

### module.breakpoints.json — Breakpoint Tokens

Top-level keys are breakpoints (`phone`, `tablet`, `laptop`, `desktop`). Phone is the default — values apply without a media query. Higher breakpoints override via `min-width` media queries. Thresholds: phone 0–640, tablet 641–1279, laptop 1280–1719, desktop 1720+.

```json
{
  "phone": { "fontSize": { "base": "14px" } },
  "tablet": {},
  "laptop": { "fontSize": { "base": "16px" } },
  "desktop": { "fontSize": { "base": "18px" } }
}
```

```css
:root {
  --np--font-size--base: 14px;
  --np--font-size--base--laptop: 16px;
  --np--font-size--base--desktop: 18px;
}
@media (min-width: 1280px) {
  :root { --np--font-size--base: var(--np--font-size--base--laptop); }
}
@media (min-width: 1720px) {
  :root { --np--font-size--base: var(--np--font-size--base--desktop); }
}
```

### module.themes.json — Theme Tokens

Top-level keys are modes (`day`, `night`). Day is the default. Night values override via `prefers-color-scheme: dark` media query.

```json
{
  "day": { "color": { "base": "hsla(210, 5%, 5%, 1)" } },
  "night": { "color": { "base": "hsla(210, 5%, 95%, 1)" } }
}
```

```css
:root {
  --np--color--base: hsla(210, 5%, 5%, 1);
  --np--color--base--day: hsla(210, 5%, 5%, 1);
  --np--color--base--night: hsla(210, 5%, 95%, 1);
}
@media (prefers-color-scheme: dark) {
  :root { --np--color--base: var(--np--color--base--night); }
}
```

### Build Pipeline

Three scripts read these files by hardcoded path (no glob discovery):

| Script | Reads | Outputs |
|--------|-------|---------|
| `scripts/generateTokens.ts` | All three modules + component.json | `src/generated/tokensData.ts`, `themeTokensData.ts`, `breakpointTokensData.ts`, `componentTokensData.ts` |
| `scripts/generateCss/` | All three modules + component.json | `dist/tokens.css`, `dist/css/{group}.css` |
| `scripts/generateTypes.ts` | All three modules | `src/generated/types.ts` |

Merge strategy in CSS generation: `{ ...coreTokens, ...modesDay, ...breakpointsPhone }` — later keys win on collision. This merged map drives the semantic `:root` variables.

---

## Variant Value Formats in createTokens

When calling `createTokens()` from nice-react-styles, variant values can be one of three formats. These can be mixed freely within the same token group.

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
createTokens({
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

### Pinning a region to a specific mode

`tokens.css` also emits two attribute-selector blocks that override the OS-preference cascade:

```css
[data-theme="day"]   { color-scheme: light; --np--color--base: var(--np--color--base--day);   /* …all mode vars */ }
[data-theme="night"] { color-scheme: dark;  --np--color--base: var(--np--color--base--night); /* …all mode vars */ }
```

The attribute selector outranks `@media (prefers-color-scheme: dark)`, so when `data-theme` is set on an element the pin wins. The reassignments cascade to every descendant — nice components, raw markup, third-party widgets that read `var(--np--…)` alike.

Three ways consumers pin:

| Approach | Code | Use when |
|---|---|---|
| Whole page | `<html data-theme="day">` | App-wide default that overrides OS preference (e.g. storybook). |
| Subtree via React | `<Theme name="day">{children}</Theme>` from `nice-react-styles` | Pin a region; uses a `<div style="display:contents">` so layout is unaffected. |
| Subtree via raw HTML | `<section data-theme="day">…</section>` | Same mechanism without React. |

### Component `mode` prop

Visual components (Typography, Tile, Button, Icon, Image, Input) implement their `theme` prop by wrapping their rendered output in `<Theme name={theme}>` when the prop is set. Consequences:

- Descendants of `<Tile mode="night">` automatically inherit night via the cascade — no need to set `mode` on each child.
- A child with its own `mode` prop pins itself (and its descendants), overriding the ancestor.
- Internal styled-components do **not** thread `$mode`; they reference semantic vars and rely on the cascade.

### Escape hatch — explicit primitive

The third `mode?` argument on `getToken(name, variant, mode)` returns the bare mode-primitive reference (`var(--np--…--day)` or `--night`) — bypassing the cascade entirely. Use only when an element inside a pinned region needs the opposite mode regardless of any ancestor pin (e.g. Button's inverted-mode text contrast).

### ThemeType (nice-styles)

Core type for mode props across the ecosystem. Extensible for consumer-defined custom modes.

```ts
import type { ThemeType } from "nice-react-styles"
// "day" | "night" | (string & {})
```

Component packages re-export as component-specific aliases:

```ts
// nice-react-typography
import type { TypographyThemeType } from "nice-react-typography"
// TypographyThemeType = ThemeType
```

Higher-level components (app code, wrapper components) import `ThemeType` from nice-react-styles:

```ts
import type { ThemeType } from "nice-react-styles"

interface MyComponentProps {
  mode?: ThemeType
}
```
