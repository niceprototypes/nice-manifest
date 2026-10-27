# Agents — Entry Point

Single entry for an AI agent joining the Nice platform cold: build an app on nice-* packages, reuse components, or add one the Nice way. Links into the manifest; does not restate it.

> **Load order:** `../discipline/` (always-on Core, wins every conflict) → `../README.md` (discovery index) → this file → topic files on demand.
> **Verified:** Quickstart run end-to-end 2026-10-15 in a throwaway app outside `~/nice` (`tsc --noEmit`, `vite build`, `vite` dev, headless screenshot). Trial notes: `../.reports/agent-platform/status.md`.

---

## 1. Quickstart — new app consuming linked nice-* packages

No scaffold command exists (`nicely --help` has no `create`/`init`). Steps below are the verified manual path.

### 1.1 package.json

```json
{
  "type": "module",
  "scripts": { "dev": "vite", "build": "tsc --noEmit && vite build", "typecheck": "tsc --noEmit" },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "styled-components": "^6.1.19",
    "nice-styles": "file:~/nice/styles",
    "nice-react-styles": "file:~/nice/react-styles",
    "nice-react-flex": "file:~/nice/react-flex",
    "nice-react-ink": "file:~/nice/react-ink",
    "nice-react-icon": "file:~/nice/react-icon",
    "nice-react-icon-vendor": "file:~/nice/react-icon-vendor",
    "nice-react-button": "file:~/nice/react-button"
  },
  "devDependencies": {
    "vite": "^7.1.9",
    "@vitejs/plugin-react": "^5.0.4",
    "typescript": "^6.0.3",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/node": "*",
    "nice-config-vite": "file:~/nice/config-vite",
    "nice-toolkit": "file:~/nice/toolkit",
    "nice-vite-watcher": "file:~/nice/vite-watcher"
  }
}
```

- Replace `~` with the absolute home path (npm does not expand `~`). Inside `~/nice` use `file:../{dir}`.
- Directory ≠ package name: `nice-react-button` lives in `~/nice/react-button`. Map: `../../toolkit/registry.json`, or `catalog.json` → `packages[].directory`.
- `nice-toolkit` + `nice-vite-watcher` are peer deps of `nice-config-vite`; `@types/node` is needed for `import.meta.dirname` in a typechecked `vite.config.ts`.
- `nice-react-icon` lists `nice-react-icon-vendor` as a peer — install both whenever any icon-bearing package (button, input, …) is used.
- Linked packages resolve `dist/`. Fresh clone / stale dists: `nicely build all` (see §6).

### 1.2 vite.config.ts

```ts
import { defineConfig, mergeConfig } from "vite"
import react from "@vitejs/plugin-react"
import { createNiceViteConfig } from "nice-config-vite"

export default defineConfig(
  mergeConfig(createNiceViteConfig({ appRoot: import.meta.dirname }), { plugins: [react()] }),
)
```

What it sets (dedupe, aliases, `fs.allow`, optimizer exclusions, `liveLinks`): `~/nice/config-vite/README.md`.

### 1.3 src/nice/tokens.ts — app tokens

```ts
import { setTokens } from "nice-react-styles"

export const getToken = setTokens({
  brandColor: { primary: { day: "#dc0000", night: "#ff6666" } },   // theme-aware
  gap: { page: { "phone+": "16px", "laptop+": "32px" } },           // responsive
})
```

- `setTokens` returns `getToken` typed for core tokens + this map (`react-styles/src/services/setTokens/index.ts`). One call per app; spread maps together.
- Responsive keys: bare `phone` = that band **only** (≤640px). Use `phone+` for "from phone up", else the token is undefined at tablet. Value formats: `../read/styles/tokens.md` → "Variant Value Formats in setTokens".
- Legal token groups/variants: read `~/nice/styles/src/generated/types.ts` or `listTokens()`. Never invent one (`../discipline/grounding.md` §2).

### 1.4 src/main.tsx — provider, fonts, icons, reset

```tsx
import { createRoot } from "react-dom/client"
import { StylesProvider } from "nice-react-styles"   // imports nice-styles/tokens.css itself
import "nice-react-icon-vendor"                       // side effect: registers Lucide resolver
import "./nice/tokens"                                // side effect: setTokens
import "nice-styles/reset.css"                        // optional; must load after tokens.css
import App from "./App"

createRoot(document.getElementById("root")!).render(
  <StylesProvider googleFonts="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght,ROND@6..144,1..1000,37&family=Roboto+Mono:wght@100..700&display=swap">
    <App />
  </StylesProvider>,
)
```

| Concern | API | Source of truth |
|---|---|---|
| Fonts | `StylesProvider` props `googleFonts` / `adobeFonts` / `links` | `react-styles/src/components/StylesProvider/StylesProvider.types.ts` |
| Theme (default) | none — OS `prefers-color-scheme` maps to `night` | `../read/styles/tokens.md` → "Theme Architecture" |
| Theme pin | `<Theme name="night">` (subtree), `applyTheme("night")` (document), `data-theme` attr | same |
| Theme read | `useTheme()` — requires `<StylesProvider detectTheme>` | `StylesProvider.types.ts` |
| Device | `useDevice()` — requires `detectDevice` | same |
| Breakpoints | `useBreakpoint`, `withBreakpoints`, `setTokens({ breakpoints })` | `../read/styles/breakpoints.md` |
| Reset | `import "nice-styles/reset.css"` (+ `reset.spacing/colors/borders/responsive.css`) | `~/nice/styles/package.json` exports; story `basics-reset--docs` |
| Nice icons | `<Icon name="star" />` — names: `iconNames` from `nice-icons` | `react-icon/src/constants.ts` |
| Lucide icons | `<Icon name="TrendingDown" vendor />` (PascalCase); Button: `iconLeft` + `iconVendor` | `react-icon-vendor/src/services/resolveVendorIcon.ts` |
| Custom icon | `<Icon vendorComponent={MyIcon} />` | `react-icon/src/components/Icon/Icon.tsx` |

### 1.5 Using components and tokens in app code

```tsx
import styled from "styled-components"
import Flex from "nice-react-flex"
import Button from "nice-react-button"
import { getToken } from "./nice/tokens"

const Brand = styled.div`color: ${getToken("brandColor", "primary")};`

<Flex direction="column" gap="base"><Button filled iconLeft="star">Go</Button></Flex>
```

---

## 2. Architecture map

| Layer | Packages | Read |
|---|---|---|
| Application | nice-storybook (`~/nice/storybook`), website (`~/nice/website`, package name `np`), nice-browser (`~/nice/browser`) | `../read/projects/` |
| Feature / Utility | `nice-react-*` (button, input, select, dialog, tile, flex, ink, icon, …) | `catalog.json` |
| Context | nice-react-styles (`StylesProvider`, `Theme`, `setTokens`, breakpoint hooks; re-exports all of nice-styles) | `../read/inheritance.md` → Context Layer |
| Foundation | nice-styles (tokens), nice-icons (SVG set), nice-config-{typescript,rollup,jest,eslint,prettier,exports,vite,crxjs}, nice-toolkit, nice-vite-watcher | `../topics/build-config.md`, `../build/` |

Tier order (authoritative, used by `build`/`publish`): `~/nice/toolkit/registry.json`.

### Tokens → CSS

```
styles/src/tokens/modules/{group}.json        core groups (+ $breakpoints, $themes)
styles/src/tokens/components/{prefix}.json    component tokens (+ $themes, $breakpoints, $inverse)
        │  npm run build (nice-styles)
        ▼
styles/src/generated/*.ts  (data + type unions)    styles/dist/tokens.css  (:root, @media, [data-theme])
        │                                                   │ imported by StylesProvider
        ▼                                                   ▼
getToken("group", "variant") / getToken("prefix.path:variant") → "var(--np--…)"
setTokens(map) → <style data-nice-tokens> injected at runtime (overrides / custom tokens)
```

CSS name pattern `--np--{prefix}--{group}--{variant}`; build names with `getToken` (registered) or `getConstant` (unregistered). Never hand-write `--np--`. Detail: `../read/styles/tokens.md`.

### services vs utilities

| Folder | Exported | Rule |
|---|---|---|
| `src/services/` | yes — public API, re-exported by `services/index.ts` | one function per file |
| `src/utilities/` | no — internal | one function per file, no index |

Detail: `../edit/component.md` → "src".

---

## 3. Component catalog

`catalog.json` (this folder) — generated, machine-readable. Per component: package, directory, version, nice-* peers, exports, `{C}Props` members (type, alias-resolved union, optional, JSDoc, `@default`), states (boolean props + state-named token variants), token addresses (`prefix.path:variant`) with theme/breakpoint axes, Storybook ids (component page + per-prop pages, local and deployed URLs).

```bash
node ~/nice/manifest/agents/scripts/generate-catalog.mjs      # rewrite catalog.json
```

```bash
# query examples
jq '.packages[].components[] | {name, story: .story.id}' ~/nice/manifest/agents/catalog.json
jq '.packages[].components[] | select(.name=="Button") | .props[] | {name, type, resolved}' ~/nice/manifest/agents/catalog.json
```

Limits: aliases resolve one level within `{C}.types.ts` only (imported aliases such as `SizeType` stay unresolved — read `styles/src/generated/types.ts`). `story.deployed` ids match the **local** story sources; the deployed Storybook (`niceprototypes.com/ui`) lags until the next `npm run deploy-storybook` from `~/nice/website`. Re-run the generator after any prop / token / story change.

Live docs: local Storybook `cd ~/nice/storybook && npm run storybook` → `http://localhost:6006`; deployed `https://niceprototypes.com/ui/`.

---

## 4. Rules of composition

| Rule | Source |
|---|---|
| Compose existing components before writing new markup; check `catalog.json` first | this file |
| Layout through `nice-react-flex` (`gap`, `padding` take gap tokens / shorthand) | `catalog.json` → Flex |
| Text through `nice-react-ink` (size, weight, color tokens) | `catalog.json` → Ink |
| Every size, color, duration, z-index is a token; no inline literal sizes — add an app token via `setTokens` | `../read/styles/tokens.md`; Standard Bearers → token system |
| Missing token / getter → stop and report (showstopper), do not hardcode | `../README.md` → "The token system is the origin pattern" |
| Theme via cascade: pin with `theme` prop / `<Theme>`, never thread `$theme` into styled-components | `../read/styles/tokens.md` → "Component `theme` prop" |
| Typed values (variants, statuses, icon names) come from the type union, never from memory | `../discipline/grounding.md` §2 |
| React from `nice-react-styles`; `nice-styles` only outside React | `../read/styles/tokens.md` → "Import Guidance" |
| No `className` prop on new Nice components unless a consumer needs one | memory rule; `../edit/component.md` |

---

## 5. Extending — new component checklist

Order follows `../discipline/refactor-safety.md` (producer before consumer). Reference implementation: **nice-react-ink** (single) / **nice-react-scroll** (multi).

1. Read `../read/inheritance.md` → pick the layer; confirm no existing package covers it (`catalog.json`).
2. Create `~/nice/react-{name}/` with the structure in `../edit/component.md` → "Folder Structure" (`src/components/{C}/{C}.tsx|.types.ts|.styles.ts|.test.tsx|index.ts`).
3. Config: extend `nice-config-typescript/react`, `nice-config-rollup`, `nice-config-jest` (`../topics/build-config.md`). Copy from react-ink.
4. `package.json`: nice-* as `peerDependencies` (`^current`) + `file:` `devDependencies`; no nice-* in `dependencies` (`../build/symlinks.md`).
5. Tokens: add `~/nice/styles/src/tokens/components/{prefix}.json` → rebuild nice-styles → `ComponentPrefix` gains the prefix. Read via `getToken("{prefix}.{group}:{variant}")`. **Foundation change: get user approval first.**
6. Types: every prop `{C}{Prop}Type`; default-export the types namespace (`../edit/component.md` → Type Naming).
7. Exports: `package.exports.json` + `npm run generate-exports` where the package uses it; components `default`, everything else named.
8. Register in `~/nice/toolkit/registry.json` (correct tier) — required for `build`, `publish`, `nice-config-vite` dedupe/exclusions.
9. Stories: `~/nice/storybook/stories/React/Components/{C}/` per `../edit/storybook.md`; add the package to storybook `package.json` as `file:../react-{name}`.
   Include the lifecycle story: `../edit/storybook.md` → "Component docs pattern" piece 4.
10. Re-run `generate-catalog.mjs`. Run offboarding (`../discipline/offboarding.md`): `read/inheritance.md`, `publish/npm.md`, `read/audit.md`, registry.

---

## 6. Verification checklist

| Step | Command | Where |
|---|---|---|
| Typecheck | `npm run typecheck` (`tsc --noEmit`) | package / app |
| Unit tests | `npm test` (packages that define it) | package |
| Build package | `npm run build` (rollup) or `nicely build <name>` (tier order + dependents) | package / anywhere |
| Build app | `npm run build` | app |
| Storybook | `cd ~/nice/storybook && npm run storybook` (port 6006) | storybook |
| Lifecycle story | page `{Component}/lifecycle` loops through its states with no interaction (`../edit/storybook.md` piece 4) | storybook |
| Screenshot | headless Chrome: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --window-size=900,700 --virtual-time-budget=4000 --screenshot=out.png http://localhost:PORT` | any |
| Catalog fresh | `node ~/nice/manifest/agents/scripts/generate-catalog.mjs` | anywhere |
| Offboarding | reconcile manifest ↔ code | `../discipline/offboarding.md` |

Build success ≠ token variant exists (registry validates at runtime) — typecheck and look at the rendered page.

---

## 7. Known pitfalls

| Symptom / trap | Cause | Fix | Read |
|---|---|---|---|
| "Invalid hook call", lost styled-components context | duplicate React / s-c in a linked package's `node_modules` | `nicely dedupe` | `../build/symlinks.md` |
| Consumer sees old code after editing a package | stale `dist/` or Vite optimizer cache | `nicely build <name>` → `nicely clean`; hard-reload tab | `../discipline/stale-first.md` |
| "module X does not provide export Y" | optimizer cache after foundation edit | `nicely clean --vite` | same |
| `npm install` inside a linked package breaks consumers | reinstalls singletons into the linked copy | `nicely unlink` first, or `nicely dedupe` after; in storybook re-run `nicely` | `~/.claude/CLAUDE.md`, `../build/symlinks.md` |
| A non-linked copy of a nice-* package in some `node_modules` | npm resolved the registry version instead of `file:` | check `readlink node_modules/nice-*`; reinstall with `file:` | `../build/symlinks.md` |
| Responsive token missing at tablet | bare `phone` key is phone-band only | use `phone+` | §1.3 |
| Publishing | — | only `nicely publish` (cascade); never `npm publish`; user approval required | `../publish/npm.md`, `../publish/bump-intent.md` |
| Deploy | — | `npm run deploy-storybook` from `~/nice/website`, with approval | memory: deploy command |
| Editing nice-styles / foundation | — | propose first; user approves | `../README.md` → Standard Bearers |
| App bundle ~1.5 MB (one Button + Icon) | `react-icon/dist/index.esm.js` ≈ 875 KB (full nice-icons set) + `react-icon-vendor/dist/index.esm.js` ≈ 783 KB (full Lucide set bundled) | known; no per-icon tree-shaking today | trial report |
