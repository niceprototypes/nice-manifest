# Third-Party Libraries — Nice Ecosystem

**Date:** 2026-05-07
**Last updated:** 2026-06-01
**Scope:** All `nice-*` packages plus the integral runtime of `nice-website-2025`.
**Excluded:** `nice-storybook` (entirely), and non-integral website features
(Firebase, web-vitals, `@mdx-js/*`, `remark-gfm`, `ajv`, `react-helmet-async`).

---

## Progress Log

- **2026-06-01 — `lucide-react` middleware removed (shipped).** Per
  `research/lucide-react-replacement.md`, `nice-react-icon-vendor` now depends
  on `lucide` (`^1.16.0`, data-only) and renders via a locally-owned
  `VendorIcon` component; the `lucide-react` React wrapper is gone from the
  vendor package. `<Icon vendor name="…" />` API unchanged. **Residual cleanup:**
  `lucide-react` is still a stale (unimported) direct dep in
  `nice-website-2025/package.json` — safe to drop. Out-of-scope consumers
  `nice-storybook` and `nice-website-viveka` also still list it.

---

## Methodology

- Inventoried `dependencies` + `peerDependencies` in every `package.json`
  under `~/nice/`.
- Verified actual import surface via grep in `src/` (skipped `node_modules`,
  `dist`, `package-lock.json`).
- Excluded test-only infrastructure (jest, ts-jest, @testing-library, etc.)
  and lint/format tooling (eslint, prettier) — these are dev-only and never
  shipped to consumers; replacing them confers no ecosystem benefit.
- Two scores per library, both out of 10:
  - **Replace Benefit:** strategic value of swapping in a Nice-owned solution
  - **Replace Complexity:** engineering effort to do so (10 = effectively impossible)

---

## Summary (sorted by Replace Benefit)

| Library | Used by | Benefit | Complexity |
|---------|---------|---------|------------|
| ~~`lucide-react`~~ → `lucide` (data-only) ✅ shipped | react-icon-vendor | 8 | 3 |
| `@svgr/rollup` | react-icon | 5 | 4 |
| `rollup-plugin-dts` | most nice-react-* | 5 | 5 |
| `rollup` + `@rollup/plugin-*` | every nice-react-* | 3 | 9 |
| `tsx` | nice-styles scripts | 3 | 2 |
| `tslib` | every nice-react-* | 2 | 1 |

---

## Detailed Entries

### rollup + `@rollup/plugin-{node-resolve, commonjs, typescript, json}`
- **Used by:** every `nice-react-*` package via `nice-configuration/rollup`
- **Role:** bundler producing `dist/index.js`, `dist/index.esm.js`,
  `dist/index.d.ts`.
- **Pros:**
  - Tree-shakable ESM output suits library packages.
  - Plugin model is mature and well-documented.
  - `nice-configuration` already centralises the config — one upgrade
    propagates.
- **Cons:**
  - Watch-mode caching has been a recurring pain point (see the
    `awaitWriteFinish` + `usePolling` workarounds in `config.js`).
  - Multi-package incremental builds are coordinated by `ntk --dev`, not
    by rollup itself — the dev-loop is brittle.
- **Replace Benefit: 3/10** — bundling is not a domain Nice differentiates
  in. Time spent here is time not spent on tokens, components, or apps.
- **Replace Complexity: 9/10** — writing a bundler from scratch is a
  multi-quarter project. esbuild/swc-based alternatives exist but are also
  third-party.

---

### `@rollup/plugin-typescript` (separate score)
- **Pros:** integrates `tsc` with rollup; emits both source maps and `.d.ts`.
- **Cons:** declaration generation goes via `tsc`, then `rollup-plugin-dts`
  re-bundles. The two-step pipeline is the source of the "stale orphan
  d.ts" incident, since closed by adopting `fs.rmSync` for dist cleanup.
- Considered together with `rollup` above.

---

### rollup-plugin-dts
- **Used by:** most `nice-react-*` packages (devDep)
- **Role:** bundles per-file `.d.ts` outputs into a single `dist/index.d.ts`.
- **Pros:** consumers see one declaration file; type-resolution time on
  consumer side is faster.
- **Cons:** the source of the stale-orphan problem; re-reads any `.d.ts`
  in `dist/types/` regardless of whether the source still exists. Nice
  now mitigates this by `fs.rmSync('dist', …)` before every build.
- **Replace Benefit: 5/10** — internal alternative would be a small script
  that walks `dist/types/`, follows imports from `index.d.ts`, and emits
  a flattened bundle. Would also let Nice control the cleanup contract
  natively.
- **Replace Complexity: 5/10** — non-trivial but bounded; ~500 lines of
  TypeScript-AST walking. The harder cases (re-exports, type-only
  imports, declaration merging) need careful handling.

---

### tslib
- **Used by:** every `nice-react-*` package (devDep, sometimes runtime via
  TypeScript helpers)
- **Role:** runtime helpers emitted by the TypeScript compiler when
  `importHelpers: true`.
- **Pros:** smaller compiled output by deduplicating helpers.
- **Cons:** ties bundle size optimization to a third-party shim.
- **Replace Benefit: 2/10** — replacing means changing TS compiler
  behaviour, not Nice code. No strategic alignment.
- **Replace Complexity: 1/10** — set `importHelpers: false` in
  `nice-configuration/typescript/base.json`, accept the small per-package
  duplication cost.

---

### tsx
- **Used by:** `nice-styles` build scripts (`scripts/clean.ts`,
  `generateTokens.ts`, `generateCss/`, `generateTypes.ts`, `postBuild.ts`)
- **Role:** runs `.ts` files directly without a separate build step.
- **Pros:** zero-config TypeScript execution; faster than `ts-node` for
  scripts; matches the "scripts that produce dist" pattern in
  nice-styles.
- **Cons:** another runtime to keep current; another binary in CI.
- **Replace Benefit: 3/10** — could be replaced by `tsc`-then-`node`, but
  that doubles the script runtime.
- **Replace Complexity: 2/10** — change `package.json` scripts only; add
  a small `tsc -p scripts/tsconfig.json` step.

---

### @svgr/rollup
- **Used by:** `nice-react-icon` (the only documented justified rollup
  exception in `edit/configuration.md`).
- **Role:** transforms imported `.svg` files into React components so
  `nice-react-icon` can re-export icons from `nice-icons` as JSX.
- **Pros:** standard, well-tested SVG-to-component transform.
- **Cons:** the only thing keeping `nice-react-icon` from using the
  default `createConfiguration()` path. Forces the icon package onto a
  bespoke rollup setup that the rest of the ecosystem does not share.
- **Replacement direction:** `nice-icons` already has a build script that
  generates `index.js`. Extending that script to emit pre-built React
  components (or a tiny `<NiceSvg>` wrapper that takes the SVG markup as
  a prop) would let `nice-react-icon` go back to the standard rollup
  config.
- **Replace Benefit: 5/10** — would eliminate the only justified rollup
  exception and re-align `nice-react-icon` with the standard bearer.
- **Replace Complexity: 4/10** — extend `nice-icons/scripts/generateIndex.js`
  to also output `dist/components/{Name}{Stroke|Fill}Icon.tsx`, then
  consume them from `nice-react-icon`. Need to handle the
  `vector-effect: non-scaling-stroke` and `registerVendorResolver`
  hooks the audit notes already document.

---

### lucide-react
- **Status (2026-06-01): SHIPPED — React middleware removed.** `nice-react-icon-vendor`
  now imports `{ icons } from "lucide"` (data-only, `^1.16.0`) and renders through a
  locally-owned `VendorIcon` component. The `lucide-react` runtime dependency is gone
  from the vendor package; `lucide` (the data) is retained intentionally per the user
  constraint. This row stays in the report for the record but is **closed**. Residual
  stale `lucide-react` dep lingers (unimported) in `nice-website-2025/package.json` —
  removable. Original analysis below preserved as the snapshot that drove the work.
- **Used by:** `nice-react-icon-vendor/src/services/resolveVendorIcon.ts`
  (single import: `import { icons } from "lucide-react"`). Listed as a
  peer dependency of `nice-react-icon-vendor`.
- **Role:** vendor icon library plugged into `nice-react-icon`'s
  `registerVendorResolver` system as a fallback when a name isn't in
  `nice-icons`.
- **Pros:**
  - Large existing icon set (~1500 icons) at zero authoring cost.
  - The vendor-resolver pattern was designed to make this swappable —
    the coupling is one file.
- **Cons in context of Nice's internal-bias:**
  - Nice already has `nice-icons` (31 icons) and the architecture to
    extend it. Every icon imported from Lucide is an icon Nice has
    elected not to own.
  - The vendor package exists *because* of this gap — it has no other
    purpose, so the third-party library is effectively the package.
  - Lucide ships 1500 icons; the website's actual usage is far smaller
    and could be enumerated and migrated incrementally.
- **Replace Benefit: 8/10** — strong alignment with the internal-bias
  thesis. Owning the icon set ends the vendor-resolver indirection and
  removes an entire package whose only role is bridging.
- **Replace Complexity: 3/10** — audit website usage of Lucide names,
  add SVGs to `nice-icons` for each, retire `nice-react-icon-vendor`.
  The architectural seams are already in place.

---

## Cross-Cutting Observations

1. **Highest-benefit-lowest-complexity targets** (top-right of the
   benefit/complexity quadrant): `lucide-react` (8/3) ✅ **done 2026-06-01**,
   `react-helmet-async` (6/3), `tslib` (2/1).
   These are quick wins.

2. **Largest strategic prize:** replacing `react-scripts` + `@craco/craco`
   together (combined effective benefit 9, complexity 5–6). One project,
   removes two third-party deps, ends the TypeScript-version drift
   exception.

3. **Off-limits:** `react`, `react-dom`, `typescript`. The ecosystem is
   defined relative to these.

4. **The styled-components question:** the highest-impact migration on
   the runtime side. Worth a dedicated decision document — every
   component's `.styles.ts` is on the line. The internal-bias case is
   real (the token registry already does most of the work) but the
   migration spans every package.

5. **The bundler question:** `rollup` itself is hard to replace; the
   *plugins around it* (dts, svgr) are individually replaceable and
   would consolidate ownership in `nice-configuration`. That's where the
   practical gains live.

---

## Suggested Order of Investigation

1. ~~`lucide-react` removal~~ — ✅ **shipped 2026-06-01.** Swapped the vendor
   package to `lucide` (data-only) + local `VendorIcon`. Remaining: drop the
   stale `lucide-react` dep from `nice-website-2025/package.json`.
2. `tslib` removal — flip `importHelpers` in the shared tsconfig.
3. `react-helmet-async` replacement — internal `useDocumentHead` hook in
   the website's `src/nice/`.
4. `react-scripts` + `@craco/craco` replacement — Vite-based
   `nice-react-app` template using `nice-vite-watcher`.
5. `@svgr/rollup` removal — extend `nice-icons` to emit pre-built JSX,
   re-align `nice-react-icon` with the standard rollup config.
6. `rollup-plugin-dts` replacement — small declaration-bundler in
   `nice-configuration`.
7. `styled-components` — separate strategic decision; not bundled with
   the others.