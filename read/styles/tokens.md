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

## getCssConstant

For component-scoped tokens:

```ts
import { getCssConstant } from "nice-styles"

getCssConstant("button", "height", "small")
// { key: "--button--height--small", var: "var(--button--height--small)" }

getCssConstant("button", "statusPrimaryBase", "backgroundColor")
// { key: "--button--status-primary-base--background-color", var: "var(--button--status-primary-base--background-color)" }
```

**Always use getCssConstant for CSS variable strings. Never construct manually.**

---

## createTokens (nice-react-styles)

Creates CSS custom properties with a GlobalStyles component and typed getter function.

```ts
import { createTokens } from "nice-react-styles"

const { GlobalStyles, getComponentToken } = createTokens(tokenMap, prefix?)
```

### Signature

```ts
createTokens(tokenMap: TokenMap, prefix?: string): ComponentTokens
```

- `tokenMap`: Object mapping token names to variant → value objects
- `prefix`: Optional CSS variable prefix (defaults to `"app"`)

### Auto-Override Detection

When using the default `"app"` prefix, tokens that match core nice-styles token names are automatically treated as overrides:

```ts
const AppTokenMap = {
  // Override tokens (exist in core) → use "core" prefix
  fontSize: { base: "20px", larger: "40px" },
  gap: { base: "32px", larger: "120px" },

  // Custom tokens (not in core) → use "app" prefix
  brandColor: { primary: "#dc0000" },
  gradient: { light: "linear-gradient(...)" },
} as const

const { GlobalStyles } = createTokens(AppTokenMap)
// Generates:
// --core--font-size--base: 20px
// --core--gap--larger: 120px
// --app--brand-color--primary: #dc0000
```

### Component Tokens

When a specific prefix is provided, all tokens use that prefix (no auto-override):

```ts
const ButtonTokenMap = {
  size: { small: "32px", base: "48px" },
  borderRadius: { base: "8px" },  // Won't override core borderRadius
} as const

const { GlobalStyles, getComponentToken } = createTokens(ButtonTokenMap, "button")
// Generates:
// --button--size--small: 32px
// --button--border-radius--base: 8px
```
