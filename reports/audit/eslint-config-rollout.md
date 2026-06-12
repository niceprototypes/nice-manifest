# Shared ESLint Config Rollout

**Date:** 2026-05-23
**Source:** extracted from `infrastructure.md` Priority 1.9.
**Benefit:** 5 · **Complexity:** 3 · **Status:** Pending

---

## Driver

The 1.5 normalization removed `lint` scripts from packages that referenced eslint without a backing config. This item adds the shared config back so those scripts can return.

## Current state

- `nice-configuration/eslint` does not exist yet.
- Only `react-button`, `react-input`, and `react-tile` currently ship a `.eslintrc`.
- Every other TS-source package has no lint surface at all.

## Scope

1. Add `nice-configuration/eslint` (TypeScript + React rule set, matching the rollup/tsconfig/jest exports already present in nice-configuration).
2. Wire a `./eslint` subpath export in `nice-configuration/package.json`.
3. Restore `lint` scripts in every TS-source package, extending the shared config.
4. Update `manifest/edit/configuration.md` to document the new export and its consumer pattern.

## Out of scope

- Lint of generated files (`src/generated/`, `dist/`).
- Prettier alignment — tracked separately under the manifest's Alignment Principle table.

## Acceptance

- `npm run lint` passes in every TS-source package.
- `manifest/README.md` Alignment table row for "Lint config" moves from "not yet aligned" to "aligned via `nice-configuration/eslint`".