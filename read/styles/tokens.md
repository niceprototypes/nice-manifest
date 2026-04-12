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
| group | kebab-case | `font-size`, `foreground-color`, `border-radius` |
| item | kebab-case | `base`, `large`, `primary-hover` |

**Double dashes (`--`) separate segments. Single dashes within segments for compound words.**

### Core Token Examples

```
--np--font-size--base
--np--foreground-color--link
--np--border-radius--larger
--np--background-color--base--day      (mode primitive)
--np--foreground-color--base--night     (mode primitive)
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
getToken("foregroundColor")
getToken("borderRadius")
```

### Token Items (camelCase or kebab)

```ts
getToken("fontSize", "base")
getToken("fontSize", "large")
getToken("foregroundColor", "link")
```

### Type Names (PascalCase + Type suffix)

```ts
FontSizeType        // "smaller" | "small" | "base" | "large" | "larger"
ForegroundColorType // "lighter" | "light" | "medium" | ... | "error"
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
| `borderColor` | `border-color` | base, heavy, heavier |
| `borderRadius` | `border-radius` | smaller, small, base, large, larger |
| `borderWidth` | `border-width` | base, large |
| `boxShadow` | `box-shadow` | base, large |
| `cellHeight` | `cell-height` | smaller, small, base, large, larger |
| `fontFamily` | `font-family` | base, code, heading |
| `fontSize` | `font-size` | smaller, small, base, large, larger |
| `fontWeight` | `font-weight` | light, base, medium, semibold, bold, extrabold, black |
| `foregroundColor` | `foreground-color` | lighter, light, medium, heavy, base, disabled, link, success, warning, error |
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

In React projects, import all nice-styles assets from `nice-react-styles`, which re-exports the nice-styles public API. Import directly from `nice-styles` only when working outside the React framework (e.g., vanilla JS, build scripts, non-React tooling).

**Exception:** `getCoreToken` is only available from `nice-styles` directly. In React projects, use `getToken` from `nice-react-styles` instead — it provides the same `TokenResult` shape and also supports runtime-registered custom tokens.

```ts
// React projects — use getToken (covers core + custom tokens)
import { getToken, getBreakpoint, type FontSizeType } from "nice-react-styles"

// Non-React contexts — getCoreToken is available here
import { getCoreToken, getBreakpoint, type FontSizeType } from "nice-styles"
```

---

## getCoreToken (nice-styles only)

Static core token accessor. Returns CSS variable name and raw value from core token data only. **Not re-exported from nice-react-styles.** In React projects, use `getToken` from `nice-react-styles` instead — it returns the same `TokenResult` shape and also resolves runtime-registered custom tokens.

```ts
// Non-React contexts only
import { getCoreToken } from "nice-styles"

getCoreToken("fontSize", "base")
// → { key: "--np--font-size--base", var: "var(--np--font-size--base)", value: "16px" }
```

### Return Shape

```ts
interface TokenResult {
  key: string   // "--np--font-size--base"
  var: string   // "var(--np--font-size--base)"
  value: string // "16px"
}
```

### Usage

```ts
// React projects — use getToken instead
import { getToken } from "nice-react-styles"

const StyledDiv = styled.div`
  font-size: ${getToken("fontSize", "large").var};
  color: ${getToken("foregroundColor", "medium").var};
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
getConstant("foregroundColor", "base", { mode: "night" })
// → { key: "--np--foreground-color--base--night", var: "var(--np--foreground-color--base--night)" }

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
  prefix: ComponentPrefix,  // "button" | "icon" | "tile" | "typography"
  tokenName: string,
  variant?: string,         // defaults to "base"
  mode?: string
): TokenResult
```

### Examples

```ts
import { getComponentToken } from "nice-react-styles"

getComponentToken("button", "size", "base")
// → { key: "--np--button--size--base", var: "var(--np--button--size--base)", value: "var(--np--cell-height--base)" }

getComponentToken("icon", "color", "error")
// → { key: "--np--icon--color--error", var: "var(--np--icon--color--error)", value: "var(--np--foreground-color--error)" }
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
getToken("foregroundColor", "link")   // → --np--foreground-color--link

// Mode-specific primitives
getToken("backgroundColor", "base", "day")    // → --np--background-color--base--day
getToken("backgroundColor", "base", "night")  // → --np--background-color--base--night

// Custom tokens (after registration)
getToken("brandColor", "primary")     // → --np--brand-color--primary
```

### createTokens — Register + Generate CSS

Registers app-level token overrides and custom tokens in the runtime registry. Returns a GlobalStyles component (no-op if CSS already injected).

```ts
import { createTokens, getToken } from "nice-react-styles"

const AppTokenMap = {
  // Override core tokens
  fontSize: { base: "20px", larger: "40px" },

  // Custom tokens
  brandColor: { primary: "#dc0000" },

  // Mode-aware tokens
  headerColor: {
    base: { day: "#000", night: "#fff" },
  },
} as const

export const { GlobalStyles: AppStyles } = createTokens(AppTokenMap)
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

### hasToken — Check Existence

```ts
import { hasToken } from "nice-react-styles"

hasToken("fontSize")    // true (core token)
hasToken("brandColor")  // true (after registration)
hasToken("unknown")     // false
```

### getTokenNames — List All Tokens

```ts
import { getTokenNames } from "nice-react-styles"

getTokenNames()
// ["fontSize", "foregroundColor", "gap", "brandColor", ...]
```

---

## Token Source Modules (nice-styles)

Token values originate from three JSON module files in `nice-styles/src/tokens/`. Each module has the same data pattern (token groups → variants → values) but a different condition structure that determines how the values are emitted as CSS.

### Module Files

| File | Condition | JSON Shape | Default |
|------|-----------|------------|---------|
| `module.json` | None (static) | `{ group: { variant: value } }` | Always active |
| `module.size.json` | Breakpoint | `{ breakpoint: { group: { variant: value } } }` | `mobile` is default |
| `module.color.json` | Mode | `{ mode: { group: { variant: value } } }` | `day` is default |

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

### module.size.json — Breakpoint Tokens

Top-level keys are breakpoints (`mobile`, `tablet`, `desktop`). Mobile is the default — values apply without a media query. Higher breakpoints override via `min-width` media queries.

```json
{
  "mobile": { "fontSize": { "base": "14px" } },
  "tablet": {},
  "desktop": { "fontSize": { "base": "16px" } }
}
```

```css
:root {
  --np--font-size--base: 14px;
  --np--font-size--base--desktop: 16px;
}
@media (min-width: 1280px) {
  :root { --np--font-size--base: var(--np--font-size--base--desktop); }
}
```

### module.color.json — Mode Tokens

Top-level keys are modes (`day`, `night`). Day is the default. Night values override via `prefers-color-scheme: dark` media query.

```json
{
  "day": { "foregroundColor": { "base": "hsla(210, 5%, 5%, 1)" } },
  "night": { "foregroundColor": { "base": "hsla(210, 5%, 95%, 1)" } }
}
```

```css
:root {
  --np--foreground-color--base: hsla(210, 5%, 5%, 1);
  --np--foreground-color--base--day: hsla(210, 5%, 5%, 1);
  --np--foreground-color--base--night: hsla(210, 5%, 95%, 1);
}
@media (prefers-color-scheme: dark) {
  :root { --np--foreground-color--base: var(--np--foreground-color--base--night); }
}
```

### Build Pipeline

Three scripts read these files by hardcoded path (no glob discovery):

| Script | Reads | Outputs |
|--------|-------|---------|
| `scripts/generateTokens.ts` | All three modules + component.json | `src/generated/tokensData.ts`, `colorTokensData.ts`, `sizeTokensData.ts`, `componentTokensData.ts` |
| `scripts/generateCss/` | All three modules + component.json | `dist/variables.css`, `dist/color-scheme.css`, `dist/css/{group}.css` |
| `scripts/generateTypes.ts` | All three modules | `src/generated/types.ts` |

Merge strategy in CSS generation: `{ ...coreTokens, ...colorDay, ...sizeMobile }` — later keys win on collision. This merged map drives the semantic `:root` variables.

---

## Variant Value Formats in createTokens

When calling `createTokens()` from nice-react-styles, variant values can be one of three formats. These can be mixed freely within the same token group.

### Static (string)

```ts
{ gap: { none: "0", base: "32px" } }
```

### Responsive (breakpoint object)

Detected by `isBreakpointValue()` — checks for `mobile` key.

```ts
{ gap: { base: { mobile: "24px", desktop: "32px" } } }
```

Generates a mobile-first default + breakpoint primitives + media query reassignment.

### Mode-aware (mode object)

Detected by `isModeValue()` — checks for `day` key. Checked after breakpoint (if an object has both `mobile` and `day`, breakpoint wins).

```ts
{ headerColor: { base: { day: "#000", night: "#fff" } } }
```

Generates semantic variable + day/night primitives + `prefers-color-scheme` media query.

### Mixed Example

```ts
createTokens({
  gap: {
    none: "0",                                  // static
    base: { mobile: "24px", desktop: "32px" },  // responsive
  },
  headerColor: {
    base: { day: "#000", night: "#fff" },       // mode-aware
    accent: "#dc0000",                          // static
  },
})
```

---

## Mode Architecture

- **"day"** is the default mode (`DEFAULT_MODE` in nice-react-styles)
- **"night"** replaces "dark" for mode suffixes throughout the system
- Stable primitives: `--np--*--day` and `--np--*--night` are never reassigned
- `@media (prefers-color-scheme: dark)` maps semantic vars to `--night` primitives
- `color-scheme: light dark` on `:root` enables native browser dark scheme

### ModeType (nice-styles)

Core type for mode props across the ecosystem. Extensible for consumer-defined custom modes.

```ts
import type { ModeType } from "nice-react-styles"
// "day" | "night" | (string & {})
```

Component packages re-export as component-specific aliases:

```ts
// nice-react-typography
import type { TypographyModeType } from "nice-react-typography"
// TypographyModeType = ModeType
```

Higher-level components (app code, wrapper components) import `ModeType` from nice-react-styles:

```ts
import type { ModeType } from "nice-react-styles"

interface MyComponentProps {
  mode?: ModeType
}
```
