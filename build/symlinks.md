# Local Package Linking

## file: References

nice-* interdependencies are linked locally through `file:` **devDependencies**; the published contract is a caret **peer** range:

```json
{
  "peerDependencies": {
    "nice-styles": "^17.1.0",
    "react": ">=19.2.0"
  },
  "devDependencies": {
    "nice-styles": "file:../styles",
    "nice-config-rollup": "file:../config-rollup"
  }
}
```

**Rules** (full policy: `edit/component.md` → Local Development Dependencies):
- `dependencies`: no nice-* packages
- `peerDependencies`: every runtime nice-* package, `^<current local version>`; rewritten to `^<new version>` at publish when that package is in the same run
- `devDependencies`: `file:` link for each nice-* peer, plus the `nice-config-*` packages

---

## nice-toolkit

CLI tool: `nicely` (short alias) or `nice-toolkit` (long form).

### Commands

#### Workspace-level triad (cache / singletons / build)

These three operations target distinct layers and do not overlap. Each addresses a distinct symptom. Detailed topology in `manifest/.nice/reports/caches.md` and the `Configuration/Caches` story.

| Command | Target | Reach for it when |
|---------|--------|-------------------|
| `nicely clean` | each consumer's `node_modules/.cache` + `.vite`; also kills processes on discovered dev-server ports (parsed from `.env` `PORT=` and `package.json` `-p`/`--port` flags) | Dev server is serving stale code after a linked-package source change |
| `nicely dedupe` | duplicate singletons (react, styled-components, etc.) inside each linked package's `node_modules` | "Invalid hook call" or styled-components context mismatch |
| `nicely build all` | walks registry tier order, runs `npm run build` in every linked nice-* package | Fresh clone; after `dedupe`; after a foundation-package refactor |
| `nicely build icons` | rebuilds only `nice-icons` + its dependents (`nice-react-icon`, `nice-react-icon-vendor`, `nice-react-button`) in tier order, resolved via the same reverse-dependency graph `publish` uses. Auto-stops a concurrent dev watcher: if a running `nicely develop` is detected (both rebuild the same dist and would race), it stops it first — the same reflex as the `--vite` port-kill — then builds. Pass `--no-kill` to build anyway. Also accepts `--convert [path]` (nice-svg-generator `.source` `.ai` → svg first; path = a folder or a single `.ai` file, omit for all) | Changed an SVG / icon asset and want a targeted build instead of a full `build all` |

Common reset: `nicely reset` (chains `build all → dedupe → clean`), then restart any dev server. The individual commands can also be run separately if you only need one.

`nicely clean --no-kill` skips the port-kill phase (CI / scripted contexts).

#### Linking / dev / publish

| Command | Purpose |
|---------|---------|
| `nicely develop` | Rebuild + reload loop across linked packages (the common setup) |
| `nicely develop --reload-only` | Reload trigger only, for an external rebuilder (was `--watch`) |
| `nicely develop --no-reload` | Rebuild only, no reload trigger |
| `nicely unlink` | Restore packages to npm versions |
| `nicely dedupe <path>` | Dedupe singletons in a specific package without linking |
| `nicely reset` | Chain `build all → dedupe → clean` (post-foundation-refactor recovery) |
| `nicely publish pkg1 pkg2` | Publish with automatic dependency cascade |
| `nicely publish --no-npm` | Bump, build, commit, push — skip npm publish |
| `nicely <command> --dry-run` | Preview any mutating command without executing |

### Default Excluded Packages

Removes from linked packages to prevent duplicate instances:
- react
- react-dom
- styled-components
- @types/react
- @types/react-dom

### Custom Exclusions

```bash
# Override defaults
nicely link ../my-package --exclude react,react-dom

# Add to defaults
nicely link ../my-package --add-exclude @emotion/react
```

---

## Common Workflows

### Fresh clone of the workspace

```bash
# In each consumer (website, storybook, website-viveka, …)
npm install

# Once, anywhere
nicely build all
```

The `prepare` hook is no longer wired into nice-* packages (see `manifest/.nice/reports/npm-install-breaks-consumers.md`). `npm install` in a consumer no longer rebuilds linked packages — `nicely build all` is the explicit replacement.

### After npm install in a linked package

```bash
nicely dedupe
```

### After modifying package.json dependencies

```bash
npm install
nicely dedupe
```

### Dev server is serving stale code after a linked-package source change

```bash
nicely clean
```

Then restart the dev server. `clean` kills the running process holding the port before wiping caches, so the next start picks up fresh state.

### Developing with CRA/webpack

Terminal 1:
```bash
npm start
```

Terminal 2:
```bash
nicely develop
```

### Developing with Vite

Vite uses `nice-vite-watcher` instead. See `vite.md`.

---

## "Invalid hook call" Error

Cause: Multiple React instances from linked packages.

Fix:
```bash
nicely dedupe
```

---

## Watch Mode Flow (CRA/webpack)

```
Source change in linked package
       ↓
--dev runs rollup rebuild
       ↓
dist/ files update
       ↓
--watch detects change
       ↓
Touches .symlink-trigger.js
       ↓
CRA/webpack recompiles
```

Setup for CRA:
```js
// src/index.tsx
import './.symlink-trigger.js';
```

Add to .gitignore:
```
.symlink-trigger.js
```