# tsup `--dts` Adoption for Component Packages

**Date:** 2026-05-23
**Source:** extracted from `infrastructure.md` Priority 1.3.
**Benefit:** 7 · **Complexity:** 7 · **Status:** Blocked on TS 6 / tsup upstream fix

---

## Driver

Replace the rollup + `rollup-plugin-dts` two-step build with `tsup --dts` to:

- Collapse the JS build and the declaration bundle into a single tool invocation.
- Remove the stale-orphan-dts class of bugs that motivated the `fs.rmSync('dist', …)` workaround in `nice-configuration/src/rollup/config.js`.
- Cut per-package devDependencies (`@rollup/plugin-*`, `rollup-plugin-dts`, `rollup`) once consumers are migrated.

## Current state

- Every `nice-react-*` package builds via `nice-configuration/rollup`.
- `nice-vite-watcher/tsconfig.json` already carries the workaround that this work would consume.
- The upstream tsup bug against TypeScript 6 blocks switching the standard bearer (`nice-react-typography`) over.

## Scope

1. Track the tsup TS 6 fix upstream; pin the unblocking version once published.
2. Add a `nice-configuration/tsup` factory mirroring the rollup factory's options surface (`input`, `additionalExternals`, `bundlePackages`, `dts`).
3. Migrate the standard bearer (`nice-react-typography`) first; verify dist parity with the rollup output (same exports, same `.d.ts` shape, same tree-shake characteristics).
4. Roll the migration through the rest of `nice-react-*` in tier order.
5. Remove rollup devDependencies from migrated packages.

## Out of scope

- The application layer (`nice-storybook`, `nice-website-2025`) — those use their own pipelines.
- `nice-react-icon` — the `@svgr/rollup` exception there is tracked in `manifest/.nice/reports/research/third-party-libraries.md`.

## Blockers

- TypeScript 6 + tsup `--dts` upstream issue. Track before scheduling work.

## Acceptance

- Standard bearer builds via `tsup --dts` with byte-equivalent dist for the public API surface.
- Migrated packages drop `@rollup/plugin-*`, `rollup-plugin-dts`, `rollup` from devDependencies.
- `manifest/edit/configuration.md` and `manifest/edit/component.md` describe the tsup factory as the primary path, with rollup deprecated.