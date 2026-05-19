# Local Package Linking

## file: References

All nice-* interdependencies use `file:` references for local development:

```json
{
  "dependencies": {
    "nice-styles": "file:../nice-styles"
  },
  "peerDependencies": {
    "react": ">=19.2.0"
  },
  "devDependencies": {
    "nice-configuration": "file:../nice-configuration"
  }
}
```

**Rules:**
- `dependencies`: Use `file:` for all nice-* packages
- `peerDependencies`: Keep semver ranges (consumers provide)
- `devDependencies`: Use `file:` for nice-configuration and for local testing of peerDependencies

---

## nice-toolkit

CLI tool: `ntk` (short alias) or `nice-toolkit` (long form).

### Commands

#### Workspace-level triad (cache / singletons / build)

These three operations target distinct layers and do not overlap. Each addresses a distinct symptom. Detailed topology in `manifest/.nice/reports/caches.md` and the `Configuration/Caches` story.

| Command | Target | Reach for it when |
|---------|--------|-------------------|
| `ntk --clean-caches` | each consumer's `node_modules/.cache` + `.vite`; also kills processes on discovered dev-server ports (parsed from `.env` `PORT=` and `package.json` `-p`/`--port` flags) | Dev server is serving stale code after a linked-package source change |
| `ntk --dedupe` | duplicate singletons (react, styled-components, etc.) inside each linked package's `node_modules` | "Invalid hook call" or styled-components context mismatch |
| `ntk --build-all` | walks registry tier order, runs `npm run build` in every linked nice-* package | Fresh clone; after `--dedupe`; after a foundation-package refactor |

Common reset: `ntk --clean-caches && ntk --dedupe && ntk --build-all`, then restart any dev server.

`ntk --clean-caches --no-kill` skips the port-kill phase (CI / scripted contexts).

#### Linking / dev / publish

| Command | Purpose |
|---------|---------|
| `ntk --dev` | Run dev scripts in all linked packages concurrently |
| `ntk --watch` | Watch dist folders, trigger webpack/CRA recompilation |
| `ntk --dev --watch` | Combined (recommended for CRA projects) |
| `ntk --unlink` | Restore packages to npm versions |
| `ntk --clean-only <path>` | Clean singletons in a specific package without linking |
| `ntk --create <name>` | Scaffold a new package, register in registry.json |
| `ntk --publish pkg1,pkg2` | Publish with automatic dependency cascade |
| `ntk --publish --no-npm` | Bump, build, commit, push — skip npm publish |
| `ntk --dry-run` | Preview changes without executing |

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
ntk --exclude react,react-dom ../my-package

# Add to defaults
ntk --add-exclude @emotion/react ../my-package
```

---

## Common Workflows

### Fresh clone of the workspace

```bash
# In each consumer (website, storybook, website-viveka, …)
npm install

# Once, anywhere
ntk --build-all
```

The `prepare` hook is no longer wired into nice-* packages (see `manifest/.nice/reports/npm-install-breaks-consumers.md`). `npm install` in a consumer no longer rebuilds linked packages — `ntk --build-all` is the explicit replacement.

### After npm install in a linked package

```bash
ntk --dedupe
```

### After modifying package.json dependencies

```bash
npm install
ntk --dedupe
```

### Dev server is serving stale code after a linked-package source change

```bash
ntk --clean-caches
```

Then restart the dev server. `--clean-caches` kills the running process holding the port before wiping caches, so the next start picks up fresh state.

### Developing with CRA/webpack

Terminal 1:
```bash
npm start
```

Terminal 2:
```bash
ntk --dev --watch
```

### Developing with Vite

Vite uses `nice-vite-watcher` instead. See `vite.md`.

---

## "Invalid hook call" Error

Cause: Multiple React instances from linked packages.

Fix:
```bash
ntk --dedupe
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