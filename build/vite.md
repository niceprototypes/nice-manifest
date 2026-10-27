# Vite Configuration

## nice-vite-watcher

Vite plugin for hot-reloading linked packages. Use this instead of `nicely develop --reload-only` for Vite projects.

### Installation

```bash
npm install -D nice-vite-watcher
```

### Basic Usage

```ts
import { viteWatcher } from 'nice-vite-watcher'

export default defineConfig({
  plugins: [
    viteWatcher({
      packages: {
        'nice-react-button': '/path/to/nice-react-button',
      },
      verbose: true,
    }),
  ],
})
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `packages` | required | Package name → local path mapping |
| `watchDir` | `'dist'` | Subdirectory to watch |
| `verbose` | `false` | Log changes |
| `debounce` | `300` | Debounce delay in ms |

---

## Source Aliases

For packages without special build transforms (SVGR, PostCSS), use source aliases for true HMR:

```ts
import { getSourceAliases } from 'nice-vite-watcher'

const linkedPackages = {
  'nice-react-button': '/path/to/nice-react-button',
  'nice-react-icon': '/path/to/nice-react-icon',  // Uses SVGR - skip
}

// Only alias packages that don't need build transforms
const aliases = getSourceAliases(
  linkedPackages,
  ['nice-react-button'],  // Aliasable packages
  'index.ts'              // Entry point
)

export default defineConfig({
  resolve: {
    alias: aliases,
  },
})
```

---

## Combined Strategy

```ts
import { viteWatcher, getSourceAliases } from 'nice-vite-watcher'

const linkedPackages = {
  'nice-react-button': '../nice-react-button',
  'nice-react-icon': '../nice-react-icon',
  'nice-react-flex': '../nice-react-flex',
}

// Packages WITHOUT special build transforms
const sourceAliasable = ['nice-react-button', 'nice-react-flex']

export default defineConfig({
  plugins: [
    viteWatcher({
      packages: linkedPackages,
      verbose: true,
    }),
  ],
  resolve: {
    alias: getSourceAliases(linkedPackages, sourceAliasable),
  },
  optimizeDeps: {
    exclude: Object.keys(linkedPackages),
  },
})
```

---

## Strategy Comparison

| Package Type | Strategy | HMR Behavior |
|--------------|----------|--------------|
| Simple TypeScript/React | Source alias | True HMR (state preserved) |
| Uses SVGR, PostCSS | Dist watching | Full reload |

---

## Storybook Integration

Storybook gets this setup from `nice-config-vite` (`config-vite/README.md`), which reads the
linked packages from the toolkit registry and wires `viteWatcher` + `getSourceAliases` when
`liveLinks` is on:

```ts
// .storybook/main.ts
import { mergeConfig } from "vite"
import { createNiceViteConfig } from "nice-config-vite"

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  viteFinal: async (config) =>
    mergeConfig(config, createNiceViteConfig({ appRoot: resolve(__dirname, ".."), liveLinks: true })),
}
```

Chrome extensions (CRXJS) use `nice-config-crxjs` on top of it (`config-crxjs/README.md`).

---

## Packages Requiring Dist Watching

Cannot use source aliases (require build transforms):
- `nice-react-icon` - SVGR transforms SVG imports

Can use source aliases:
- All other nice-react-* packages