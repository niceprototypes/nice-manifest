## File Size and Decomposition

When a single file accumulates many functions, refactor it into a folder with the same name. The folder's `index.js` re-exports the public API so the import path stays the same.

```
# Before — one file growing indefinitely
src/publisher.js  (400+ lines, 15 functions)

# After — folder with focused files
src/publisher/
├── index.js        # Orchestrator, re-exports public API
├── constants.js    # Static values
├── helpers.js      # Shared utilities
├── graph.js        # Dependency resolution
└── otp.js          # OTP management
```

This is not a strict rule. Complex functions that are long but cohesive should stay in one file. The trigger is when a file becomes a collection of loosely related functions that are hard to index at a glance. The goal is AI parsability — a future Claude instance should be able to read a file and understand its scope without scrolling past unrelated logic.

---

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
    ├── utilities (optional)
    │   └── {utility1}.ts
    ├── services (optional)
    │   ├── {service1}.ts
    │   └── index.ts
    ├── tokens
    │   ├── {Component}Styles.ts
    │   ├── get{Component}Token.ts
    │   └── index.ts
    └── index.ts
```

### Key Structure Rules

1. **Components live in `src/components/{Component}/`** - never at the src root level
2. **Each component folder contains**: the component file, types, styles, tests, and index
3. **Utilities vs Services**: utilities are internal functions, services are exported for consumers
4. **Tokens folder**: required for all components — token values live as JSON in nice-styles (`src/tokens/component/{name}/index.json`), and each component package provides a thin `get{Component}Token()` wrapper around `getComponentToken()` from nice-styles

### Multi-Component Package Structure

Reference implementation: **nice-react-scroll**

Some packages export multiple related components rather than a single primary component. These packages have no default export — every component is a named export.

```
nice-react-scroll/
└── src/
    ├── components/
    │   ├── ScrollProvider/
    │   ├── Sticky/
    │   ├── FadeOnScroll/
    │   ├── SectionLinks/
    │   └── StickySection/
    ├── hooks/
    │   └── useScroll.ts
    └── index.ts
```

**Export pattern:** Each component folder is re-exported by name. No `export { default }` — consumers import each component individually.

```ts
export { default as ScrollProvider, ScrollContext } from "./components/ScrollProvider"
export type { ScrollProviderProps } from "./components/ScrollProvider/types"
export { default as ScrollProviderTypes } from "./components/ScrollProvider/types"

export { useScroll } from "./hooks/useScroll"

export { Sticky, StickyProvider, StickyContext } from "./components/Sticky"
export type { StickyProps, StickyOrderType } from "./components/Sticky"

export { FadeOnScroll } from "./components/FadeOnScroll"
export type { FadeOnScrollProps } from "./components/FadeOnScroll"
```

**Key differences from single-component packages:**
- No default export at the package level
- No `package.exports.json` (phase 2 of the export generator)
- Components may export sub-components, contexts, and hooks from the same folder
- Types follow the same `{Component}{PropName}Type` naming convention

### Hook-Only Package Structure

Reference implementation: **nice-react-device-detector**

Packages that provide only hooks and context providers — no styled-components, no tokens, no component folder structure.

```
nice-react-device-detector/
└── src/
    ├── hooks/
    │   └── useDeviceDetector.ts
    ├── components/
    │   └── DeviceProvider/
    └── index.ts
```

**Export pattern:**

```ts
export { useDeviceDetector, default } from "./hooks/useDeviceDetector"
export { DeviceProvider, useDevice } from "./components/DeviceProvider"
```

**Key differences from component packages:**
- No styled-components dependency
- No tokens folder
- No `package.exports.json` (phase 2 of the export generator)
- Default export is a hook, not a component
- Provider components live under `src/components/` even in hook-only packages

## src

### src/scripts
- Config files for webpack, jest, etc.

### src/utilities

- Functions only used within the project and not exported for consumption
- Each function has a separate file
- No index.ts file, utilities are imported directly

### src/services

- Functions exported for external consumption
- Each function has a separate file
- index.ts re-exports all services as named exports:

```ts
export { getIcon } from "./getIcon"
export { formatDate } from "./formatDate"
```

### src/tokens

Component tokens are defined as JSON in nice-styles (`src/tokens/component/{name}/index.json`) and compiled into `dist/variables.css` at build time. Each React component package provides a thin accessor wrapper and a backward-compatible Styles export.

#### Token Values (in nice-styles)

Token values live in `nice-styles/src/tokens/component/{name}/index.json`. Values are raw CSS strings; cross-references use `var()`:

```json
{
  "size": {
    "smaller": "var(--np--cell-height--smaller)",
    "small": "var(--np--cell-height--small)",
    "base": "var(--np--cell-height--base)",
    "large": "var(--np--cell-height--large)",
    "larger": "var(--np--cell-height--larger)"
  },
  "borderRadius": {
    "small": "var(--np--border-radius--small)",
    "base": "var(--np--border-radius--base)",
    "large": "var(--np--border-radius--large)"
  }
}
```

These become CSS custom properties in `dist/variables.css`:
```css
--np--button--size--base: var(--np--cell-height--base);
--np--button--border-radius--small: var(--np--border-radius--small);
```

#### src/tokens/get{Component}Token.ts

Wrapper around `getComponentToken` from nice-styles. Forwards both flat and path-based calling conventions so all components can access nested tokens when their token structure requires it.

```ts
import { getComponentToken, type TokenResult } from "nice-react-styles"

/**
 * Get a typography component token.
 *
 * Flat lookup — for tokens at depth 1 (e.g., "fontSize", "fontFamily"):
 * ```ts
 * getTypographyToken("fontSize", "base")
 * ```
 *
 * Path lookup — for nested tokens:
 * ```ts
 * getTypographyToken(["group", "variant", "parameter"])
 * ```
 */
export function getTypographyToken(nameOrPath: string | string[], variantOrMode?: string, mode?: string): TokenResult {
  if (Array.isArray(nameOrPath)) {
    return getComponentToken("typography", nameOrPath, variantOrMode)
  }
  return getComponentToken("typography", nameOrPath, variantOrMode, mode)
}
```

#### src/tokens/{Component}Styles.ts

No-op component kept for backward compatibility. CSS custom properties are generated at nice-styles build time in `dist/variables.css`.

```ts
import type { ComponentType } from "react"

export const ButtonStyles: ComponentType = () => null
```

#### src/tokens/index.ts

Re-exports from the individual token files:

```ts
export { ButtonStyles } from "./ButtonStyles"
export { getButtonToken } from "./getButtonToken"
```

#### Component Styles in Applications

Component CSS custom properties are included automatically via `nice-styles/variables.css` (loaded by `StylesProvider`). The `{Component}Styles` exports are no-ops — they exist only for backward compatibility and can be safely omitted from `componentStyles` in `StylesProvider`.

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
import type { ForegroundColorType, FontSizeType, ModeType } from "nice-react-styles"

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

/**
 * TypographyModeType
 *
 * Re-export of ModeType from nice-styles.
 * Pin token resolution to a specific mode.
 * Extensible for consumer-defined custom modes.
 */
export type TypographyModeType = ModeType
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
import type { ForegroundColorType, FontSizeType } from "nice-react-styles"

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
  - Types (all individual types via `export *` + namespace re-exported as named)
  - Component token map
  - Component token getter

**Component folder `index.ts` (e.g. `src/components/Typography/index.ts`):**

```ts
// Re-export component
export { default } from "./Typography"

// Re-export all named types from types.ts, plus the namespace
export * from "./types"
export { default as TypographyTypes } from "./types"
```

**Package entry `src/index.ts`:**

```ts
// Main component export
export { default } from "./components/Typography"

// All named type exports + TypographyTypes namespace (re-exported from the component index)
export * from "./components/Typography"

// Token exports
export { TypographyStyles, getTypographyToken } from "./tokens"
```

**Why `export *` over a selective list:** `types.ts` is the single source of truth for a component's public type surface. Using `export *` makes it impossible for `index.ts` to drift out of sync with `types.ts` when new prop types are added. Both individual imports (`import { TypographyProps } from "nice-react-typography"`) and namespace access (`import { TypographyTypes } from "nice-react-typography"; TypographyTypes.Props`) continue to work.

**Note on `export { default }` vs `export *`:** `export *` re-exports only named exports, never the default. The package's default (the component itself) must be explicitly re-exported with `export { default } from "./components/Typography"`. The namespace is exported as `export { default as TypographyTypes }` at the types.ts level, which becomes a *named* export named `TypographyTypes` that `export *` then carries through.

### package.exports.json (required)

Every component package must have a `package.exports.json` at the package root. This config declares the public export surface and is consumed by the `nice-generate-exports` CLI to produce `src/index.ts`.

**Do not hand-edit `src/index.ts` in component packages.** Run `npm run generate-exports` after modifying `package.exports.json`.

```json
{
  "$schema": "../nice-configuration/src/exports/schema.json",
  "description": "Semantic typography component for nice-react with full token support.",
  "default": "Typography",
  "components": ["Typography"],
  "tokens": ["Typography"]
}
```

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `description` | string | optional | Short JSDoc block (max 5 lines, hard-enforced). Long-form content goes in README.md. |
| `default` | string | optional | Component name to re-export as the package default. Must be listed in `components`. |
| `components` | string[] | required | Component names. Generator emits `export * from "./components/{Name}"` for each. |
| `tokens` | string[] | optional | Subset of `components` with token wrappers. Emits `{Name}Styles, get{Name}Token` from `./tokens`. |
| `services` | string[] | optional | Function names exported from `./services`. |
| `constants` | string[] | optional | Constant names exported from `./constants`. |

Scaffolded packages (`nnl --create`) include this file and the `generate-exports` script automatically.

### Packages exempt from export generation

| Package | Reason |
|---------|--------|
| nice-react-styles | Bridge package — re-exports the entire nice-styles API. Hand-written. |
| nice-react-scroll | Multi-component package — phase 2. |
| nice-react-device-detector | Hook-only package — phase 2. |

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

Every `nice-react-*` package.json must follow this structure exactly. Deviations require documented justification in the manifest.

#### Entry Points

```json
{
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "type": "module"
}
```

#### Scripts

```json
{
  "scripts": {
    "build": "rollup -c",
    "dev": "rollup -c -w",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "npm run build",
    "prepare": "npm run build"
  }
}
```

Optional scripts (include only if applicable):
- `"test": "jest"` — only if jest config and test files exist
- `"lint": "eslint src --ext .ts,.tsx"` — use this exact format, not glob patterns

Do not add convenience scripts like `build:watch`, `test:watch`, `test:coverage`, `lint:fix`, `clean`, or `build:types`. These add maintenance surface for marginal value.

#### Files

```json
{
  "files": ["dist"]
}
```

Only `dist` is published. Do not include `src`, `README.md`, `CHANGELOG.md`, or `LICENSE` in the `files` array — npm includes README and LICENSE automatically.

#### Publishing

Before publishing, `file:` dependency references must be replaced with semver ranges:

```json
// Local development
"nice-react-styles": "file:../nice-react-styles"

// Before npm publish
"nice-react-styles": "^4.0.0"
```

Restore `file:` references after publishing. See `publish/npm.md` for the full publish order and peer dep version table.

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