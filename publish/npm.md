# npm Publishing

## CLI Publish Command

```bash
# Publish all changed packages (interactive prompts for version bumps and OTP)
nnl --publish

# Publish specific packages
nnl --publish nice-styles,nice-react-styles

# Preview what would be published
nnl --publish --dry-run

# Bump and build without publishing to npm
nnl --publish --no-npm

# Bump, build, and skip npm (e.g., only push to GitHub)
nnl --publish nice-react-styles --no-npm
```

The `--publish` command handles the full workflow:
1. Accepts an array of package names (the packages with actual changes)
2. Resolves the full dependency graph to find all affected packages
3. Prompts for version bump type per changed package; auto-patches dependents
4. **Build phase**: builds ALL packages in dependency order (slow, no OTP needed)
5. **Publish phase**: swaps deps, prompts for OTP once, publishes all in rapid succession
6. Restores `file:` refs for local development
7. Commits and pushes version changes

---

## Dependency Cascade (`--publish` graph resolution)

### Problem

When a low-level package like `nice-styles` changes, every package that depends on it (directly or transitively) must be rebuilt and republished. Manually tracking which packages are affected is error-prone and was the primary pain point in the previous publish workflow.

### Solution: Automatic Dependent Resolution

When the user specifies changed packages, the tool automatically resolves which additional packages must be included by walking the **reverse dependency graph**.

#### Input

```
nnl --publish nice-react-styles,nice-react-button
```

This means: "I made changes to nice-react-styles and nice-react-button."

#### Resolution Algorithm

```
buildReverseDependencyMap():
  For each package in PUBLISH_TIERS:
    Read package.json
    For each file: dependency:
      reverseDeps[dependency].add(package)

  Return reverseDeps

resolveAffected(changedPackages):
  affected = Set(changedPackages)
  queue = [...changedPackages]

  While queue is not empty:
    current = queue.shift()
    For each dependent in reverseDeps[current]:
      If dependent not in affected:
        affected.add(dependent)
        queue.push(dependent)

  Return affected
```

#### Example Walkthrough

Input: `["nice-react-styles", "nice-react-button"]`

```
Step 1 — Build reverse dependency map from package.json files:

  nice-styles          ← nice-react-styles
  nice-icons           ← nice-react-icon
  nice-react-styles    ← nice-react-flex, nice-react-typography, nice-react-icon, nice-react-tile, nice-react-button
  nice-react-flex      ← nice-react-tile, nice-react-button
  nice-react-typography ← nice-react-button
  nice-react-icon      ← nice-react-button

Step 2 — Resolve affected from input ["nice-react-styles", "nice-react-button"]:

  Start: {nice-react-styles, nice-react-button}
  Process nice-react-styles:
    → nice-react-flex (add, enqueue)
    → nice-react-typography (add, enqueue)
    → nice-react-icon (add, enqueue)
    → nice-react-tile (add, enqueue)
    → nice-react-button (already in set)
  Process nice-react-button:
    → (no dependents)
  Process nice-react-flex:
    → nice-react-tile (already in set)
    → nice-react-button (already in set)
  Process nice-react-typography:
    → nice-react-button (already in set)
  Process nice-react-icon:
    → nice-react-button (already in set)
  Process nice-react-tile:
    → (no dependents)

  Result: {nice-react-styles, nice-react-button, nice-react-flex, nice-react-typography, nice-react-icon, nice-react-tile}
```

#### Categorization

After resolution, packages are split into two categories:

| Category | Description | Version Bump |
|----------|-------------|--------------|
| **Changed** | Packages the user explicitly listed | Prompted (patch/minor/major) |
| **Dependent** | Packages added by graph resolution | Auto-patched |

```
Changed (user specified):
  nice-react-styles    → prompt: [p]atch / [m]inor / [M]ajor
  nice-react-button    → prompt: [p]atch / [m]inor / [M]ajor

Dependents (auto-resolved):
  nice-react-flex         → auto patch (2.0.1 → 2.0.2)
  nice-react-typography   → auto patch (5.0.1 → 5.0.2)
  nice-react-icon         → auto patch (3.0.1 → 3.0.2)
  nice-react-tile         → auto patch (4.1.0 → 4.1.1)
```

The user is only prompted for version bumps on packages they explicitly changed. Dependents are automatically patch-bumped since their only change is a rebuilt dependency.

---

## --no-npm Flag

Disables npm publishing. All other steps still execute:
- Dependency graph resolution
- Version bumps
- Builds in dependency order
- `file:` dep swap + restore
- Git commit and push

Use cases:
- Verify the full pipeline without touching npm
- Push version bumps to GitHub for CI to handle publishing
- Rebuild all affected packages without publishing

---

## Implementation: publisher.js Changes

### New Function: `buildReverseDependencyMap()`

```js
/**
 * Builds a reverse dependency map from all publishable packages.
 * Key = package name, Value = Set of packages that depend on it.
 *
 * Reads each package's package.json and checks dependencies + devDependencies
 * for file: references to other nice-* packages.
 *
 * @returns {Map<string, Set<string>>}
 */
function buildReverseDependencyMap() {
  const reverseMap = new Map()

  for (const name of ALL_PACKAGES) {
    const dir = pkgDir(name)
    try {
      const pkg = readJSON(path.join(dir, 'package.json'), { useCache: false })
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }

      for (const [depName, depVersion] of Object.entries(allDeps)) {
        if (typeof depVersion !== 'string' || !depVersion.startsWith('file:')) continue
        if (!ALL_PACKAGES.includes(depName)) continue

        if (!reverseMap.has(depName)) reverseMap.set(depName, new Set())
        reverseMap.get(depName).add(name)
      }
    } catch {
      // Package directory doesn't exist or no package.json
    }
  }

  return reverseMap
}
```

### New Function: `resolveAffected(changedPackages)`

```js
/**
 * Given explicitly changed packages, resolves all packages that must also
 * be updated by walking the reverse dependency graph (BFS).
 *
 * @param {string[]} changedPackages - Packages with actual source changes
 * @returns {{ changed: Set<string>, dependents: Set<string> }}
 */
function resolveAffected(changedPackages) {
  const reverseMap = buildReverseDependencyMap()
  const changed = new Set(changedPackages)
  const all = new Set(changedPackages)
  const queue = [...changedPackages]

  while (queue.length > 0) {
    const current = queue.shift()
    const dependents = reverseMap.get(current) || new Set()

    for (const dep of dependents) {
      if (!all.has(dep)) {
        all.add(dep)
        queue.push(dep)
      }
    }
  }

  const dependents = new Set([...all].filter(p => !changed.has(p)))
  return { changed, dependents }
}
```

### Modified `publish()` Signature

```js
/**
 * @param {object} options
 * @param {string[]} [options.packages] - Packages with actual changes
 * @param {boolean} [options.publish=true] - Whether to publish to npm
 * @param {boolean} [options.dryRun=false] - Preview mode
 * @param {number} [options.otpWindow=30] - Seconds before re-prompting for OTP
 */
async function publish({ packages, publish: doPublish = true, dryRun = false, otpWindow = 30 } = {})
```

### Modified Flow

```
1. If packages provided:
     { changed, dependents } = resolveAffected(packages)
   Else:
     Scan ALL_PACKAGES for git changes (existing behavior)

2. Display candidates:
     Changed packages → prompt for patch/minor/major
     Dependent packages → display as "auto-patch" (no prompt)

3. Bump versions

4. BUILD PHASE (all packages, before any OTP prompt):
     For each package in dependency order:
       npm run build
       swapFileDepsTfSemver()
     All packages are now built and ready to publish.

5. PUBLISH PHASE (rapid succession):
     If doPublish:
       otp = await prompt("OTP: ")
       otpTimestamp = Date.now()
       For each package in dependency order:
         If Date.now() - otpTimestamp > otpWindow * 1000:
           otp = await prompt("OTP expired, new code: ")
           otpTimestamp = Date.now()
         npm publish --otp=<otp> --ignore-scripts  (no rebuild)

6. Restore file: deps for all packages

7. Git commit and push
```

The critical change: builds happen in step 4 (slow, no time pressure), and publishes happen in step 5 (fast, `--ignore-scripts` skips rebuild). This means one OTP can cover multiple publishes. When the timer expires, the user is re-prompted — no wasted attempts.

### OTP Timer Implementation

```js
/**
 * Manages OTP lifecycle with configurable expiry window.
 * Prompts for a new code when the current one is likely expired.
 *
 * @param {number} windowSeconds - Seconds before considering OTP expired
 */
function createOtpManager(windowSeconds = 30) {
  let code = null
  let timestamp = 0

  return {
    /**
     * Returns a valid OTP, prompting if expired or not yet set.
     * @returns {Promise<string>}
     */
    async get() {
      const elapsed = (Date.now() - timestamp) / 1000
      if (!code || elapsed >= windowSeconds) {
        const label = code ? 'OTP expired, new code' : 'OTP code'
        code = await prompt(`  ${label}: `)
        timestamp = Date.now()
      }
      return code
    },

    /**
     * Forces re-prompt on next get() (e.g., after a 429 rate limit).
     */
    invalidate() {
      code = null
      timestamp = 0
    }
  }
}
```

Usage in publish phase:

```js
const otp = createOtpManager(otpWindow)

for (const p of toPublish) {
  const code = await otp.get()
  try {
    run(`npm publish --otp=${code} --ignore-scripts --access public`, { cwd: dir })
    published.push(p.name)
  } catch (e) {
    if (e.message.includes('429') || e.message.includes('EOTP')) {
      // Rate limited or expired — invalidate and retry once
      otp.invalidate()
      const retryCode = await otp.get()
      run(`npm publish --otp=${retryCode} --ignore-scripts --access public`, { cwd: dir })
      published.push(p.name)
    } else {
      failed.push(p.name)
    }
  }
}
```

### CLI Argument Changes (args.js)

```js
// New flags
options.noNpm = hasFlag(args, '--no-npm')
options.otpWindow = parseInt(getArg(args, '--otp-window') || '30', 10)
```

```bash
# Custom OTP window (default: 30 seconds)
nnl --publish --otp-window 20

# Longer window for slower connections
nnl --publish --otp-window 45
```

Passed to publisher as `publish: !options.noNpm, otpWindow: options.otpWindow`.

---

## Publish Order

Bottom to top per dependency chain:

1. nice-styles, nice-icons, nice-npm-link, nice-vite-watcher
2. nice-react-styles
3. nice-react-flex, nice-react-typography
4. nice-react-icon, nice-react-tile
5. nice-react-button
6. nice-react-scroll, nice-react-slider, nice-react-device-detector, nice-react-lightbox, nice-react-image, nice-react-input

---

## Package Dependencies

### Foundation (no peer deps)

| Package | Runtime Deps | Peer Deps |
|---------|--------------|-----------|
| nice-styles | — | — |
| nice-icons | — | — |

### Context Layer

| Package | Runtime Deps | Peer Deps |
|---------|--------------|-----------|
| nice-react-styles | nice-styles | react, react-dom, styled-components |

### Utility Layer

| Package | Runtime Deps | Peer Deps |
|---------|--------------|-----------|
| nice-react-flex | nice-react-styles | react, react-dom, styled-components |
| nice-react-typography | nice-react-styles | react, react-dom, styled-components |
| nice-react-tile | nice-react-styles | **nice-react-flex**, react, react-dom, styled-components |
| nice-react-icon | nice-icons, nice-react-styles | react, react-dom, styled-components |

### Feature Layer

| Package | Runtime Deps | Peer Deps |
|---------|--------------|-----------|
| nice-react-button | nice-react-styles, nice-react-typography | **nice-react-flex**, **nice-react-icon**, **nice-react-typography**, react, react-dom, styled-components |

### Standalone

| Package | Runtime Deps | Peer Deps |
|---------|--------------|-----------|
| nice-react-scroll | — | react, react-dom, styled-components |
| nice-react-slider | — | react, styled-components |
| nice-react-device-detector | — | react, react-dom |
| nice-react-lightbox | nice-react-styles | react, react-dom, styled-components |

---

## Peer Dep Versions

| Peer | Required Version |
|------|------------------|
| react | >=19.2.0 |
| react-dom | >=19.2.0 |
| styled-components | >=6.1.18 |
| nice-react-flex | >=2.0.0 |
| nice-react-icon | >=3.0.0 |
| nice-react-typography | >=5.0.0 |

---

## Before Publishing

1. Verify package.json has semver versions, not `file:` references
2. Check peer dep versions match the table above
3. Run `npm pack --dry-run` to verify contents

## Publish

```bash
npm publish --access public
```