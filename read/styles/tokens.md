# Token Naming Conventions

Design token naming patterns in nice-styles.

---

## CSS Variable Pattern

```
--{prefix}--{group}--{item}
```

| Segment | Format | Examples |
|---------|--------|----------|
| prefix | kebab-case | `core`, `button`, `icon` |
| group | kebab-case | `font-size`, `foreground-color`, `border-radius` |
| item | kebab-case | `base`, `large`, `primary-hover` |

**Double dashes (`--`) separate segments. Single dashes within segments for compound words.**

### Examples

```
--core--font-size--base
--core--foreground-color--link
--core--border-radius--larger
--button--height--small
--button--status-primary-base--background-color
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

## getToken Return Shape

```ts
interface TokenResult {
  key: string   // "--core--font-size--base"
  var: string   // "var(--core--font-size--base)"
  value: string // "16px"
}
```

### Usage

```ts
import { getToken } from "nice-styles"

// In styled-components
const StyledDiv = styled.div`
  font-size: ${getToken("fontSize", "large").var};
  color: ${getToken("foregroundColor", "medium").var};
`
```

---

## getConstant

For constructing CSS variable strings with optional mode support:

```ts
import { getConstant } from "nice-styles"

getConstant("button", "height", "small")
// { key: "--button--height--small", var: "var(--button--height--small)" }

getConstant("core", "backgroundColor", "base", "light")
// { key: "--core--background-color--base--light", var: "var(--core--background-color--base--light)" }

getConstant("core", "foregroundColor", "base", "dark")
// { key: "--core--foreground-color--base--dark", var: "var(--core--foreground-color--base--dark)" }
```

**Always use getConstant for CSS variable strings. Never construct manually.**

---

## Token Registry (nice-react-styles)

Unified token system with global registry. Core tokens are available immediately; custom tokens are registered via `createTokens()`.

```ts
import { createTokens, getToken } from "nice-react-styles"
```

### getToken - Unified Token Accessor

Works immediately with core tokens. Custom tokens available after `createTokens()`:

```ts
import { getToken } from "nice-react-styles"

// Core tokens (always available)
getToken("fontSize", "base")      // → --core--font-size--base
getToken("foregroundColor")       // → --core--foreground-color--base

// Custom tokens (after registration)
getToken("brandColor", "primary") // → --app--brand-color--primary
```

### createTokens - Register + Generate CSS

Registers tokens in the unified registry and returns a GlobalStyles component:

```ts
import { createTokens, getToken } from "nice-react-styles"

const AppTokenMap = {
  // Override core tokens → uses "core" prefix
  fontSize: { base: "20px", larger: "40px" },

  // Custom tokens → uses "app" prefix (or custom)
  brandColor: { primary: "#dc0000" },
} as const

export const { GlobalStyles: AppStyles } = createTokens(AppTokenMap)
export { getToken }  // Re-export for app-wide use
```

**Generated CSS:**
```css
--core--font-size--base: 20px;      /* override */
--core--font-size--larger: 40px;    /* override */
--app--brand-color--primary: #dc0000; /* custom */
```

### Namespaced Component Tokens

Use an explicit prefix for isolated component tokens:

```ts
const ButtonTokenMap = {
  height: { small: "32px", base: "48px" },
} as const

export const { GlobalStyles: ButtonStyles } = createTokens(ButtonTokenMap, "button")
// → --button--height--small, --button--height--base
```

### Signature

```ts
createTokens(tokenMap: TokenMap, prefix?: string): ComponentTokens
```

- `tokenMap`: Object mapping token names to variant → value objects
- `prefix`: Prefix for custom tokens (default: `"app"`). Core token overrides always use `"core"`.

---

## mapCoreToken - Auto-Map Core Variants

Maps all variants of a core token to `var()` references for use in component token maps. Reads the registry to discover variants automatically.

```ts
import { mapCoreToken } from "nice-react-styles"

mapCoreToken("backgroundColor")
// → { base: "var(--core--background-color--base)", alternate: "var(--core--background-color--alternate)" }

mapCoreToken("foregroundColor")
// → { lighter: "var(--core--foreground-color--lighter)", light: "var(...)", ..., error: "var(...)" }
```

**Use in component token maps:**

```ts
import { createTokens, mapCoreToken, type ComponentTokens } from "nice-react-styles"

export const TileTokenMap = {
  backgroundColor: mapCoreToken("backgroundColor"),
  foregroundColor: mapCoreToken("foregroundColor"),
} as const

export const tileTokens: ComponentTokens<typeof TileTokenMap> = createTokens(TileTokenMap, "tile")
```

Use `mapCoreToken` for 1:1 core mappings. Use `getToken().var` per variant when renaming or subsetting.

---

## Registry Utilities

### registerTokens - Manual Registration

Directly register tokens without generating CSS. Useful for dynamic token registration.

```ts
import { registerTokens } from "nice-react-styles"

registerTokens({ brandColor: { primary: "#f00" } }, "app")
```

**Merge behavior:** When registering tokens that already exist, variants are **merged** rather than replaced. This allows partial overrides:

```ts
// Core lineHeight has: condensed, base, expanded

// Override only "base" - other variants preserved
registerTokens({ lineHeight: { base: "1.75" } })

// Result: condensed (1.25), base (1.75), expanded (1.75)
getToken("lineHeight", "condensed") // ✓ Still works
```

### hasToken - Check Existence

```ts
import { hasToken } from "nice-react-styles"

hasToken("fontSize")    // true (core token)
hasToken("brandColor")  // true (after registration)
hasToken("unknown")     // false
```

### getTokenNames - List All Tokens

```ts
import { getTokenNames } from "nice-react-styles"

getTokenNames()
// ["fontSize", "foregroundColor", "gap", "brandColor", ...]
```
