# Nice Configuration Packages

This document outlines the architecture and patterns for configuration packages in the Nice ecosystem.

---

## Package Categories

The Nice ecosystem has three types of configuration packages:

| Category | Package | Purpose |
|----------|---------|---------|
| **Shareable Configs** | nice-configuration | TypeScript, Rollup, Jest configurations |
| **CLI Tools** | nice-npm-link | Local package linking and conflict resolution |
| **Build Plugins** | nice-vite-watcher | Vite plugin for linked package hot-reload |

---

## nice-configuration

Central repository for shared build tool configurations. All nice-react-* packages extend these configs.

### Structure

```
nice-configuration/
├── src/
│   ├── rollup/
│   │   ├── config.js           # createConfiguration(), isNiceExternal, createExternals
│   │   └── index.js            # Re-exports
│   ├── typescript/
│   │   ├── base.json           # Base TypeScript config
│   │   └── react.json          # Extends base with JSX support
│   └── jest/
│       ├── react.js            # React/TypeScript Jest config
│       └── css-mock.js         # CSS import mock
├── package.json
└── README.md
```

### Subpath Exports

```json
{
  "exports": {
    "./rollup": "./src/rollup/index.js",
    "./typescript/base": "./src/typescript/base.json",
    "./typescript/react": "./src/typescript/react.json",
    "./jest/react": "./src/jest/react.js",
    "./jest/css-mock": "./src/jest/css-mock.js",
    "./exports": "./dist/exports/index.js",
    "./exports/schema.json": "./src/exports/schema.json"
  },
  "bin": {
    "nice-generate-exports": "./dist/exports/cli.js"
  }
}
```

### Export Format Rationale

| Subpath | Format | Reason |
|---------|--------|--------|
| `./typescript/*` | `.json` | TypeScript `extends` requires a JSON file path |
| `./jest/*` | `.js` (default export) | Jest config expects a default-exported object |
| `./rollup` | `.js` (named exports) | Consuming configs call factory functions by name |
| `./exports` | `.js` (compiled from TS) | Application logic with validation — TypeScript source, compiled to dist/ |

### Export Generator (`./exports`)

CLI and programmatic API for generating `src/index.ts` in component packages from a declarative `package.exports.json` config. Written in TypeScript, compiled to `dist/exports/`.

```bash
nice-generate-exports .          # generate src/index.ts from package.exports.json
npm run generate-exports         # same, via package script
```

Source: `src/exports/` (TypeScript). Output: `dist/exports/` (compiled JS). Build: `npm run build` runs `tsc -p tsconfig.exports.json`.

See `edit/component.md` → "package.exports.json" for the config schema and field reference.

### TypeScript Configs

Extend via standard `extends` field:

```json
// tsconfig.json
{
  "extends": "nice-configuration/typescript/react",
  "compilerOptions": {
    "outDir": "dist",
    "declarationDir": "dist/types"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**Configurations:**
- `typescript/base` - ES2020, ESNext modules, bundler resolution, strict mode
- `typescript/react` - Extends base with `jsx: react-jsx`

### Rollup Config

Factory function pattern with sensible defaults:

```js
// rollup.config.js
import { createConfiguration } from "nice-configuration/rollup"

export default createConfiguration()

// With options
export default createConfiguration({
  input: "src/index.ts",
  additionalExternals: ["lodash"],
  bundlePackages: ["nice-icons"],
})
```

**Options:**
| Option | Default | Description |
|--------|---------|-------------|
| `input` | `'src/index.ts'` | Entry point |
| `tsconfig` | `'./tsconfig.json'` | Path to tsconfig |
| `output` | `{}` | Custom output config (merged) |
| `plugins` | `null` | Override default plugins |
| `additionalExternals` | `[]` | Extra packages to externalize |
| `bundlePackages` | `[]` | nice-* packages to bundle |
| `dts` | `true` | Generate declaration bundle |
| `dtsInput` | `'dist/types/index.d.ts'` | Declaration input path |

**Default Plugins:**
- `rollup-plugin-peer-deps-external`
- `@rollup/plugin-node-resolve` (browser: true)
- `@rollup/plugin-commonjs`
- `@rollup/plugin-typescript`
- `rollup-plugin-dts` (declaration bundling)

**Watch Mode Settings:**

The configuration includes optimized watch settings to prevent file caching issues:

```js
{
  cache: false,
  watch: {
    buildDelay: 200,
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

These settings prevent the "off by one" caching bug where changes appear one save behind.

**Exported Functions:**
- `createConfiguration(options)` - Full config factory
- `isNiceExternal(id)` - Pattern-based external detection
- `createExternals({ additional, bundle })` - Custom external function

### Jest Config

Re-export pattern for Jest:

```js
// jest.config.js
export { default } from "nice-configuration/jest/react"
```

**Included Settings:**
- `preset: ts-jest`
- `testEnvironment: jsdom`
- ESM support with `useESM: true`
- Transforms nice-* packages
- CSS mock via `moduleNameMapper`
- Testing Library setup

---

## nice-npm-link

CLI tool for managing local package links and resolving dependency conflicts.

### Structure

```
nice-npm-link/
├── nice-npm-link.js            # CLI entry (shebang → src/index.js)
├── registry.json               # Source of truth for ecosystem packages
├── package.json
└── src/
    ├── index.js                # CLI router
    ├── registry.js             # Registry query service (all consumers import from here)
    ├── args.js                 # Argument parsing
    ├── config.js               # Default conflicting packages, peer enforce list
    ├── logger.js               # Colored log output
    ├── fs-utils.js             # File system helpers with caching
    ├── pm.js                   # Package manager detection
    ├── discovery.js            # Linked package traversal
    ├── cleaner.js              # Singleton conflict removal
    ├── linker.js               # Link/unlink operations
    ├── peer-deps.js            # Peer dependency enforcement
    ├── watcher.js              # Dist folder watcher
    ├── dev-runner.js           # Concurrent dev script runner
    ├── npm-auth.js             # npm authentication verification
    ├── publisher/              # Publish workflow (separated build/publish phases)
    │   ├── index.js            # Orchestrator
    │   ├── constants.js        # Reads registry via query service
    │   ├── helpers.js          # prompt, run, pkgDir, version queries
    │   ├── versioning.js       # bumpVersion, calcVersion
    │   ├── deps.js             # file: ↔ semver swapping
    │   ├── graph.js            # Reverse dependency resolution
    │   └── otp.js              # OTP timer with configurable window
    └── creator/                # Package scaffolding
        ├── index.js            # Create orchestrator + registry registration
        ├── component.js        # Component-specific scaffolding
        └── templates.js        # File templates for new packages
```

### Package.json Configuration

```json
{
  "bin": {
    "nice-npm-link": "./nice-npm-link.js",
    "nnl": "./nice-npm-link.js"
  }
}
```

### Registry

`registry.json` is the single source of truth for which packages belong to the Nice ecosystem. Packages not in the registry are invisible to all `nnl` operations. The `--create` command is the standard way to add new packages.

#### Registry Schema

Each entry in registry.json is an object with metadata:

```json
{
  "basePath": "~/Code",
  "tiers": [
    [
      { "name": "nice-styles", "type": "foundation", "sourceAliasable": false },
      { "name": "nice-react-flex", "type": "react-component", "sourceAliasable": true },
      { "name": "nice-react-icon", "type": "react-component", "sourceAliasable": false }
    ]
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Package name, must start with `nice-` |
| `type` | enum | `foundation`, `react-component`, `cli`, `plugin` |
| `sourceAliasable` | boolean | Can be aliased to source in Vite (no SVGR/PostCSS transforms) |

Validation runs on every read via `src/registry.js`. Invalid entries throw immediately.

#### Registry Query Service (`src/registry.js`)

All consumers import from this module instead of reading `registry.json` directly.

| Function | Returns | Purpose |
|----------|---------|---------|
| `getPackageNames()` | `string[]` | All package names in tier order |
| `getTiers()` | `string[][]` | Tier arrays of name strings (backward compat) |
| `getAllPackages()` | `object[]` | All entries with full metadata |
| `getByType(type)` | `object[]` | Filter by package type |
| `getByGroup(group)` | `object[]` | Shorthand group queries |
| `getLinkedPackageMap()` | `Record<string, string>` | Name-to-path map for Vite/Storybook |
| `getSourceAliasableNames()` | `string[]` | Packages eligible for Vite source aliases |
| `addPackage(entry)` | void | Add a validated entry to the last tier |

**Groups:** `"all"`, `"react"` / `"component"`, `"foundation"`, `"linkable"`, `"source-aliasable"`

Groups are computed from `type` and `sourceAliasable` — not stored in the JSON.

#### Adding a New Package

`nnl --create` automatically registers the package with correct metadata. Storybook and other consumers read from the registry — no manual list updates needed.

### Key Commands

| Command | Description |
|---------|-------------|
| `nnl --clean-all` | Clean all file: linked packages recursively |
| `nnl --dev` | Run dev scripts in all linked packages |
| `nnl --watch` | Watch dist folders and trigger recompilation |
| `nnl --dev --watch` | Combined (recommended for CRA/webpack) |
| `nnl --unlink` | Restore packages to npm versions |
| `nnl --clean-only <path>` | Clean specific package without linking |
| `nnl --create <name>` | Scaffold a new package and register it |
| `nnl --create <name> --type component` | Scaffold a component package (default type) |
| `nnl --publish pkg1,pkg2` | Publish with automatic dependency cascade |
| `nnl --publish --no-npm` | Bump, build, commit, push — skip npm |
| `nnl --publish --otp-window 45` | Custom OTP expiry window (default: 30s) |

### Default Excluded Packages

Removes these singletons from linked packages:
- `react`
- `react-dom`
- `styled-components`
- `@types/react`
- `@types/react-dom`

---

## nice-vite-watcher

Vite plugin for hot-reloading linked packages.

### Structure

```
nice-vite-watcher/
├── src/
│   ├── viteWatcher.ts          # Main plugin function
│   ├── getSourceAliases.ts     # Resolve alias generator
│   └── index.ts                # Re-exports
├── dist/
├── package.json
└── README.md
```

### Exports

```ts
import { viteWatcher, getSourceAliases } from "nice-vite-watcher"
```

**viteWatcher(options):**
- `packages` - Package name → local path mapping
- `watchDir` - Subdirectory to watch (default: `'dist'`)
- `verbose` - Log changes (default: `false`)
- `debounce` - Debounce delay in ms (default: `300`)

**getSourceAliases(packages, aliasable, entry):**
- Generates Vite resolve aliases to package source files
- For packages without special build transforms (SVGR, PostCSS)
- Enables true HMR with state preservation

### Vite vs Webpack Strategy

| Project Type | Tool | Usage |
|--------------|------|-------|
| Vite/Storybook | nice-vite-watcher | Plugin in vite.config.ts |
| CRA/webpack | nice-npm-link --dev --watch | CLI in separate terminal |

---

## Storybook Documentation

Configuration packages are documented in `nice-storybook/stories/Configuration/`.

### Structure

```
stories/Configuration/
├── TypeScript.stories.tsx
├── Rollup.stories.tsx
├── Jest.stories.tsx
├── NpmLink.stories.tsx
└── ViteWatcher.stories.tsx
```

### Story Pattern

Configuration stories use a simplified pattern compared to component stories:

```tsx
import type { Meta, StoryObj } from "@storybook/react"
import Typography from "nice-react-typography"
import Flex from "nice-react-flex"
import { getToken } from "nice-react-styles"
import { generateDescriptionString } from "../../src/services"

// Empty demo component (no visual component to render)
const ConfigDemo = () => <></>

const meta = {
  title: "Configuration/{ConfigName}",
  component: ConfigDemo,
  parameters: {
    layout: "padded",
    previewTabs: {
      canvas: { hidden: true },  // Hide canvas for docs-only
    },
    viewMode: "docs",
    docs: {
      description: {
        component: generateDescriptionString("nice-package-name", {
          setup: [
            { value: "// config.js", code: true, newLine: true },
            { value: 'import { fn } from "nice-package"', code: true, newLine: true },
          ],
          usage: [
            { value: "export default fn()", code: true, newLine: true },
          ],
        }),
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ConfigDemo>

export default meta
type Story = StoryObj<typeof meta>

// Shared story parameters
const storyParameters = {
  docs: {
    source: { code: null },
    canvas: { sourceState: "none" },
  },
}

// Reusable code block component
const CodeBlock = ({ children }: { children: string }) => (
  <Typography
    code
    style={{
      display: "block",
      backgroundColor: getToken("backgroundColor", "alternate").var,
      padding: getToken("gap", "base").var,
      borderRadius: getToken("borderRadius", "base").var,
      whiteSpace: "pre",
      overflow: "auto",
    }}
  >
    {children}
  </Typography>
)

export const FeatureName: Story = {
  name: "featureName",
  parameters: storyParameters,
  render: () => (
    <Flex direction="column" gap="large">
      <Typography as="h3">Feature Title</Typography>
      <Typography color="medium">
        Description of the feature.
      </Typography>
      <CodeBlock>
        {`// Example code
export default config`}
      </CodeBlock>
    </Flex>
  ),
}
```

### Key Differences from Component Stories

| Aspect | Component Stories | Configuration Stories |
|--------|-------------------|----------------------|
| Demo component | Actual component | Empty fragment `<></>` |
| Canvas tab | Visible | Hidden (`previewTabs.canvas.hidden`) |
| Story structure | Uses `<Story>` component | Direct JSX with `<Flex>` + `<Typography>` |
| Code display | `code` prop on Story variables | `<CodeBlock>` helper component |
| File organization | Separate story files in `stories/` | Single file with all stories |

---

## Creating a New Configuration Package

### 1. Shareable Config

For configs that other packages extend:

```
my-config/
├── src/
│   ├── {tool}/
│   │   ├── base.{ext}
│   │   └── variant.{ext}
│   └── index.{ext}
├── package.json
└── README.md
```

Package.json:
```json
{
  "name": "my-config",
  "exports": {
    "./{tool}/base": "./src/{tool}/base.{ext}",
    "./{tool}/variant": "./src/{tool}/variant.{ext}"
  }
}
```

### 2. CLI Tool

For command-line utilities:

```
my-cli/
├── my-cli.js                   # Main script with shebang
├── package.json
└── README.md
```

Package.json:
```json
{
  "name": "my-cli",
  "bin": {
    "my-cli": "./my-cli.js",
    "mc": "./my-cli.js"         // Short alias
  }
}
```

Script shebang:
```js
#!/usr/bin/env node
// CLI implementation
```

### 3. Build Plugin

For bundler/tooling plugins:

```
my-plugin/
├── src/
│   ├── plugin.ts               # Main plugin function
│   ├── helpers.ts              # Helper utilities
│   └── index.ts                # Re-exports
├── dist/
├── package.json
└── README.md
```

Package.json:
```json
{
  "name": "my-plugin",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts"
}
```

---

## Local Development

All configuration packages use `file:` references for interdependencies. After modifying dependencies, run:

```bash
node ../nice-npm-link/nice-npm-link --clean-all
```

This removes duplicate React/styled-components from linked packages, preventing "Invalid hook call" errors.

---

## Configuration Standards

All `nice-react-*` packages must follow these canonical patterns. Deviations require documented justification.

### Canonical rollup.config.js

**Standard:**

```js
import { createConfiguration } from 'nice-configuration/rollup'

export default createConfiguration()
```

**With bundled packages:**

```js
import { createConfiguration } from 'nice-configuration/rollup'

export default createConfiguration({
  bundlePackages: ['nice-icons']
})
```

**With custom plugins (escape hatch only):**

```js
import { createConfiguration } from 'nice-configuration/rollup'
import svgr from '@svgr/rollup'
// ... other imports

export default createConfiguration({
  plugins: [
    peerDepsExternal(),
    svgr(),
    resolve({ browser: true, extensions: ['.js', '.ts', '.tsx', '.svg'] }),
    commonjs(),
    json(),
    typescript({ tsconfig: './tsconfig.json', declaration: true, declarationDir: 'dist' })
  ],
  bundlePackages: ['nice-icons']
})
```

**Never use raw rollup config arrays.**

---

### Canonical tsconfig.json

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

**Base config provides:**

| Option | Value |
|--------|-------|
| target | ES2020 |
| module | ESNext |
| lib | ES2020, DOM, DOM.Iterable |
| moduleResolution | bundler |
| jsx | react-jsx |
| declaration | true |
| declarationMap | true |
| strict | true |

**Deprecated patterns to avoid:**

- `target: "es5"` — use ES2020
- `jsx: "react"` — use react-jsx
- `moduleResolution: "node"` — use bundler
- `noEmit: true` — conflicts with declaration generation
- Custom strict options (noUnusedLocals, etc.) — already in base

---

### Canonical jest.config.js

```js
export { default } from "nice-configuration/jest/react"
```

---

## Deviation Audit

### Packages Using Non-Standard Rollup Config

| Package | Issue |
|---------|-------|
| nice-react-styles | Raw config array, manual plugin setup |
| nice-react-device-detector | Raw config array, manual plugin setup |

**Normalization:** Replace with `createConfiguration()`.

### Packages Using Non-Standard TypeScript Config

| Package | Issues |
|---------|--------|
| nice-react-icon | `target: es5`, `jsx: react`, `noEmit: true`, `moduleResolution: node` |
| nice-react-flex | `target: ES2018`, `jsx: react`, `moduleResolution: node`, redundant strict options |
| nice-react-styles | Non-standard output dirs (`dist/esm`), missing test excludes |
| nice-react-device-detector | `target: es5`, `noEmit: true`, missing excludes |

**Normalization:** Extend `nice-configuration/typescript/react`, use standard output paths.

### Packages Missing Jest Config

| Package | Status |
|---------|--------|
| nice-react-typography | No jest.config.js |
| nice-react-flex | No jest.config.js |
| nice-react-tile | No jest.config.js |
| nice-react-styles | No jest.config.js |
| nice-react-scroll | No jest.config.js |
| nice-react-slider | No jest.config.js |
| nice-react-device-detector | No jest.config.js |

**Action:** Add jest.config.js if tests exist or are planned.

---

## Justified Exceptions

| Package | Exception | Justification |
|---------|-----------|---------------|
| nice-react-icon | Custom rollup plugins | SVGR required to transform SVG imports from nice-icons into React components |
| nice-react-button | Extended getButtonToken signature (accepts path arrays) | Status/state token composition requires nested path lookup that flat signatures cannot express |
| nice-react-styles | Hand-written src/index.ts (no export generator) | Bridge package — re-exports the entire nice-styles API and adds React-specific layers. Future bridge packages (e.g., nice-vue-styles) follow the same exception. |

Add exceptions to this table with clear justification. If no justification exists, normalize the package.
