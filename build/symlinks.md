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

| Command | Purpose |
|---------|---------|
| `ntk --clean-all` | Remove duplicate singletons from all linked packages |
| `ntk --dev` | Run dev scripts in all linked packages concurrently |
| `ntk --watch` | Watch dist folders, trigger webpack/CRA recompilation |
| `ntk --dev --watch` | Combined (recommended for CRA projects) |
| `ntk --unlink` | Restore packages to npm versions |
| `ntk --clean-only <path>` | Clean specific package without linking |
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

### After npm install in linked package

```bash
ntk --clean-all
```

### After modifying package.json dependencies

```bash
npm install
ntk --clean-all
```

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
ntk --clean-all
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