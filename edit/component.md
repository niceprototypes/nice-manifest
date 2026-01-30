## ES Module Standards

- Use named exports exclusively (no default exports)
- Exception: React components use default export per React convention
- Exception: `{Component}.types.ts` uses default export for declaration merging pattern

## Folder Structure

All nice-react components follow this standardized folder structure:

```
nice-react-{component}
└── src
    ├── components
    │   ├── {Component}
    │   │   ├── {Component}.test.tsx
    │   │   ├── {Component}.tsx
    │   │   ├── index.ts
    │   │   ├── styles.ts
    │   │   └── types.ts
    │   └── {SubComponent} (optional)
    │       ├── {SubComponent}.test.tsx
    │       ├── {SubComponent}.tsx
    │       ├── index.ts
    │       ├── styles.ts
    │       └── types.ts
    ├── helpers (optional)
    │   ├── {helper1}.ts
    │   └── index.ts
    ├── services (optional)
    │   ├── {service1}.ts
    │   └── index.ts
    ├── tokens (if component has design tokens)
    │   ├── {Component}TokenMap.ts
    │   ├── {Component}Styles.ts
    │   ├── get{Component}Token.ts
    │   └── index.ts
    └── index.ts
```

### Key Structure Rules

1. **Components live in `src/components/{Component}/`** - never at the src root level
2. **Each component folder contains**: the component file, types, styles, tests, and index
3. **Helpers vs Services**: helpers are internal utilities, services are exported for consumers
4. **Tokens folder**: only required for components with design tokens (e.g., Button, Icon, Typography)
5. **Components without tokens** (e.g., Flex, Tile) use global `--core--*` tokens directly

## src

### src/scripts
- Config files for webpack, jest, etc.

### src/helpers

- Functions only used within the project and not exported for consumption
- Each function has a separate file
- No index.ts file, helpers are imported directly

### src/services

- Functions exported for external consumption
- Each function has a separate file
- index.ts re-exports all services as named exports:

```ts
export { getIcon } from "./getIcon"
export { formatDate } from "./formatDate"
```

### src/tokens

Token files are split into three separate files for clarity and maintainability:

#### src/tokens/{Component}TokenMap.ts

- Named export of token map object
- Flat structure: token key → variant → value (no `name`/`items` wrapper)
- CSS name auto-derived from key via camelToKebab (e.g., `borderRadius` → `border-radius`)
- Also exports the internal `{component}Tokens` object created by `createTokens`

**Core Token Mapping Pattern (Required)**

Components MUST declare their own tokens that reference core tokens using `.var`. This creates component-level CSS variables that:

1. **Enable component isolation**: Override `--button--size--base` without affecting `--core--cell-height--base`
2. **Cascade from core**: Core token changes automatically update components unless overridden
3. **Support per-component theming**: Different components can derive from the same core token differently

```ts
import { createTokens, getToken, type ComponentTokens } from "nice-react-styles"

export const ButtonTokenMap = {
  // Map ALL relevant core tokens to component tokens using .var
  size: {
    smaller: getToken("cellHeight", "smaller").var,
    small: getToken("cellHeight", "small").var,
    base: getToken("cellHeight").var,
    large: getToken("cellHeight", "large").var,
    larger: getToken("cellHeight", "larger").var,
  },
  borderRadius: {
    small: getToken("borderRadius", "small").var,
    base: getToken("borderRadius", "base").var,
    large: getToken("borderRadius", "large").var,
  },
  // Component-specific tokens (no core equivalent) use literal values
  customToken: {
    base: "some-value",
  },
} as const

export const buttonTokens: ComponentTokens<typeof ButtonTokenMap> = createTokens(ButtonTokenMap, "button")
```

**CRITICAL**: Always use `.var` (not `.value`) when referencing core tokens.

```ts
// ✓ CORRECT - creates: --button--size--base: var(--core--cell-height--base)
size: { base: getToken("cellHeight").var }

// ✗ WRONG - creates: --button--size--base: 48px (disconnected from core)
size: { base: getToken("cellHeight").value }
```

**Core tokens to map by component type:**

| Component | Core Tokens |
|-----------|-------------|
| Button | cellHeight, borderRadius, foregroundColor, gap |
| Typography | fontSize, fontFamily, fontWeight, lineHeight, letterSpacing, foregroundColor |
| Icon | fontSize, foregroundColor, borderWidth, animationDuration |

#### src/tokens/{Component}Styles.ts

- Exports the `{Component}Styles` GlobalStyles component
- Imports from the TokenMap file

```ts
import type { ComponentType } from "react"
import { buttonTokens } from "./ButtonTokenMap"

export const ButtonStyles: ComponentType = buttonTokens.GlobalStyles
```

#### src/tokens/get{Component}Token.ts

- Exports the `get{Component}Token` function
- Imports from the TokenMap file

```ts
import { buttonTokens } from "./ButtonTokenMap"

export const getButtonToken = buttonTokens.getToken
```

#### src/tokens/index.ts

- Re-exports from the individual token files

```ts
export { ButtonStyles } from "./ButtonStyles"
export { getButtonToken } from "./getButtonToken"
```

#### Self-Injecting Component Styles

Components with tokens automatically inject their `{Component}Styles` on render. Consumers do not need to explicitly include component styles in `StylesProvider`.

```tsx
// Component internally renders its styles
const Button: React.FC<ButtonProps> = (props) => {
  return (
    <>
      <ButtonStyles />
      <StyledButton {...props} />
    </>
  )
}
```

**How it works:**
- Each component renders its `{Component}Styles` (a `createGlobalStyle` component)
- `styled-components` automatically deduplicates - only one `<style>` tag per component type regardless of instance count
- CSS variables are injected into `:root` when the component first mounts

**Components with self-injecting styles:**
- nice-react-button → `ButtonStyles`
- nice-react-typography → `TypographyStyles`
- nice-react-icon → `IconStyles`

**Components without tokens** (e.g., Flex, Tile) use global `--core--*` tokens directly and don't require style injection.

### src/constants.ts

- All static values used throughout the project
- Named exports only:

```ts
export const ICON_NAMES = [...] as const
export const DEFAULT_SIZE = "base"
```

### src/styles.ts

- All styled-components declarations
- Named exports only
- Styled components are internal only - never export them from the package

### {Component}.types.ts

- Co-located with the component file (e.g., `types.ts` alongside `Button.tsx` in the component folder)
- All prop types abstracted as `{Component}{PropName}Type` - never hardcode types like `boolean` or `string` directly in props
- Uses declaration merging with default export for type namespace

#### Type Naming Convention

All types must be prefixed with the component name:

```ts
// Good
export type ButtonSizeType = "small" | "base" | "large"
export type ButtonOnClickType = () => void

// Bad - missing component prefix
export type SizeType = "small" | "base" | "large"
export type OnClickType = () => void
```

#### Re-exporting Types from nice-styles

When a prop uses a type from nice-styles, create a component-specific alias:

```ts
import type { ForegroundColorType, FontSizeType } from "nice-styles"

/**
 * TypographyColorType
 *
 * Re-export of ForegroundColorType from nice-styles.
 * Text color values using design tokens.
 */
export type TypographyColorType = ForegroundColorType

/**
 * TypographySizeType
 *
 * Re-export of FontSizeType from nice-styles.
 * Font size values using design tokens.
 */
export type TypographySizeType = FontSizeType
```

#### JSDoc Documentation

Every type must have a JSDoc comment with:
1. Type name as title
2. Brief description
3. List of values (for union types)

```ts
/**
 * TypographyWordBreakType
 *
 * Controls line break behavior for overflowing text.
 * Based on CSS word-break property.
 *
 * Values:
 * - "normal": Default word breaking rules
 * - "break-all": Allow breaks between any two characters
 * - "keep-all": Prevent breaks in CJK text, normal for others
 */
export type TypographyWordBreakType = "normal" | "break-all" | "keep-all"
```

#### Complete Types File Structure

```ts
import * as React from "react"
import type { ForegroundColorType, FontSizeType } from "nice-styles"

/**
 * ButtonSizeType
 *
 * Size variant for the component.
 *
 * Values:
 * - "small": Compact size for dense layouts
 * - "base": Default size
 * - "large": Prominent size for primary actions
 */
export type ButtonSizeType = "small" | "base" | "large"

/**
 * ButtonColorType
 *
 * Re-export of ForegroundColorType from nice-styles.
 * Button text color using design tokens.
 */
export type ButtonColorType = ForegroundColorType

/**
 * ButtonOnClickType
 *
 * Click handler callback function.
 */
export type ButtonOnClickType = () => void

/**
 * ButtonDisabledType
 *
 * Whether the button is disabled.
 */
export type ButtonDisabledType = boolean

/**
 * ButtonProps
 *
 * Complete prop definition for the Button component.
 */
export interface ButtonProps {
  /** Content to display inside the button */
  children: React.ReactNode
  /** Size variant */
  size?: ButtonSizeType
  /** Text color from nice-styles tokens */
  color?: ButtonColorType
  /** Click handler */
  onClick: ButtonOnClickType
  /** Disabled state */
  disabled?: ButtonDisabledType
}

// Legacy exports for backwards compatibility
export type SizeType = ButtonSizeType
export type OnClickType = ButtonOnClickType

// Declaration merging: const + namespace creates exportable type namespace
const ButtonTypes = {} as const

namespace ButtonTypes {
  export type Size = ButtonSizeType
  export type Color = ButtonColorType
  export type OnClick = ButtonOnClickType
  export type Disabled = ButtonDisabledType
  export type Props = ButtonProps
}

export default ButtonTypes
```

#### Key Requirements

1. **Component prefix on all types** - `{Component}{PropName}Type` format
2. **JSDoc on every type** - title, description, values list
3. **Re-export nice-styles types** - create component-specific aliases
4. **Legacy exports** - for backwards compatibility when renaming types
5. **Complete namespace** - include all types in the namespace, not just Props
6. **Empty const required** - namespaces with only types produce no JavaScript output

#### Importing Types

Components import types from their co-located types file:

```ts
// In Button.tsx
import type { ButtonProps } from "./types"
```

### {Component}.tsx

- React Component implementation
- No logic in this file, only imports and default export
- Exception: React components use default export per convention

### {Component}.test.tsx

- Co-located test file for the component
- Tests component behavior, not implementation details

### index.ts

- Default export React component
- Named exports for everything else:
  - Constants
  - Services
  - Types (default export re-exported as named)
  - Component token map
  - Component token getter

```ts
// Re-export component
export { default } from "./Button"

// Re-export types (both individual and namespace)
export type { ButtonProps, ButtonSizeType, ButtonOnClickType } from "./Button.types"
export { default as ButtonTypes } from "./Button.types"

// Re-export tokens
export { ButtonStyles, getButtonToken } from "../tokens"
```

## TypeScript Configuration

Extend `nice-configuration/typescript/react` for standardized TypeScript setup:

```json
{
  "extends": "nice-configuration/typescript/react",
  "compilerOptions": {
    "outDir": "dist",
    "declarationDir": "dist/types"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

The base configuration includes:
- `target`: ES2020
- `module`: ESNext
- `moduleResolution`: bundler
- `declaration`: true
- `declarationMap`: true
- `strict`: true
- `skipLibCheck`: true
- `jsx`: react-jsx (via /react extension)

## Local Development Dependencies

For local development, all nice-* package interdependencies use `file:` references instead of npm semver ranges. This enables live changes to propagate through the dependency chain.

### Pattern

```json
{
  "dependencies": {
    "nice-styles": "file:../nice-styles",
    "nice-react-styles": "file:../nice-react-styles"
  },
  "peerDependencies": {
    "nice-react-flex": ">=1.0.0",
    "react": ">=19.2.0"
  },
  "devDependencies": {
    "nice-configuration": "file:../nice-configuration",
    "nice-react-flex": "file:../nice-react-flex"
  }
}
```

### Rules

1. **Runtime dependencies** (`dependencies`): Use `file:` for all nice-* packages
2. **Peer dependencies** (`peerDependencies`): Keep semver ranges (consumers provide these)
3. **Dev dependencies** (`devDependencies`):
   - Use `file:` for `nice-configuration`
   - Add `file:` references for any nice-* peerDependencies (for local testing)

### After Modifying Dependencies

Run `node ../nice-npm-link/nice-npm-link --clean-all` from the consuming project to remove duplicate React/styled-components from linked packages.

---

## Rollup Configuration

Use `nice-configuration/rollup` for standardized build setup:

```js
import { createConfiguration } from 'nice-configuration/rollup'

export default createConfiguration()
```

All plugins are baked in - no imports or configuration required for standard components.

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `input` | `'src/index.ts'` | Entry point |
| `tsconfig` | `'./tsconfig.json'` | Path to tsconfig |
| `output` | `{}` | Custom output config (merged with defaults) |
| `plugins` | `null` | Override default plugins (escape hatch) |
| `additionalExternals` | `[]` | Extra packages to externalize |
| `bundlePackages` | `[]` | nice-* packages to bundle instead of externalize |
| `dts` | `true` | Generate declaration bundle |
| `dtsInput` | `'dist/types/index.d.ts'` | Input path for declaration bundling |

### Default Plugins

The configuration includes these plugins by default:
- `rollup-plugin-peer-deps-external` - Externalize peer dependencies
- `@rollup/plugin-node-resolve` - Resolve node modules (browser: true)
- `@rollup/plugin-commonjs` - Convert CommonJS to ESM
- `@rollup/plugin-typescript` - TypeScript compilation with sourcemaps
- `rollup-plugin-dts` - Bundle declaration files

### Watch Mode Configuration

The configuration includes optimized watch settings for reliable hot-reload:

```js
{
  cache: false,  // Disable rollup's internal caching
  watch: {
    buildDelay: 200,  // Debounce rapid changes
    clearScreen: false,
    chokidar: {
      awaitWriteFinish: {
        stabilityThreshold: 150,
        pollInterval: 50
      },
      usePolling: true,
      interval: 100
    }
  }
}
```

These settings prevent the "off by one" caching issue where file changes would appear one save behind. The `awaitWriteFinish` option ensures files are fully written before rollup reads them.

### Auto-Externalized Packages

The configuration automatically externalizes:
- All `nice-*` packages (including subpaths like `nice-styles/variables.css`)
- React ecosystem (`react`, `react-dom`, `react/jsx-runtime`)
- `styled-components`

### Output

Generates dual format builds with bundled declarations:
- `dist/index.js` (CJS)
- `dist/index.esm.js` (ESM)
- `dist/index.d.ts` (bundled types)

All include sourcemaps and use named exports.

### Package.json Requirements

```json
{
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts"
}
```

## JSDoc Standards

For JavaScript files in nice-configuration, use JSDoc for type documentation:

```js
/**
 * Brief description of the function
 *
 * @param {Object} options - Parameter description
 * @param {string} [options.name='default'] - Optional param with default
 * @param {string[]} options.items - Required array param
 * @returns {boolean} Return value description
 */
export function myFunction(options = {}) {
  // implementation
}
```

### Common Type Annotations

| Annotation | Usage |
|------------|-------|
| `{string}` | String value |
| `{string[]}` | Array of strings |
| `{Object}` | Object parameter |
| `{Array}` | Generic array (use when element types vary) |
| `{boolean}` | Boolean value |
| `{function(string): boolean}` | Function type with signature |
| `[param]` | Optional parameter (in square brackets) |
| `[param='value']` | Optional with default value |