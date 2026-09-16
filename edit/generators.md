# Generators & Emitters

Standards for code that **produces** code, CSS, or data: build-time generators (`nice-styles/scripts/*`, icon/source generators, `nice-config-exports`) and the runtime emitters they share logic with (`nice-styles/src/utilities/css/*`, `generateTokenCSS`). Inline comment rules live in [`comments.md`](comments.md); this file covers structure, documentation, and tests.

Evidence base: [`.reports/research/token-system-comparables.md`](../.reports/research/token-system-comparables.md) (Style Dictionary, Terrazzo, Primer, Polaris, Carbon, Panda, Chakra, Tamagui).

---

## Pipeline shape

Every generator follows one pipeline, each phase in its own module:

| Phase | Verb | Output | Rule |
|---|---|---|---|
| Read | `read*` | raw source data | File I/O only. No splitting, merging, or validation. |
| Normalize | `normalize*` / one `read{Name}Sources` entry | **one typed model** | Built **once** and consumed by every emitter. Emitters never re-read or re-split sources. |
| Validate | `validate*` | throws | Runs once, on the model. Messages come from one template source (`errors.json`), not inline strings. |
| Generate | `generate{Axis}Css` / `generate{Axis}` | fragments (line arrays) | Pure. One axis or concern per function (theme, breakpoint, component, alias). |
| Assemble | `assemble{File}` | one file's content | Orders fragments. Holds no emission logic. |
| Write | `write*` | files on disk | I/O only. Header from the shared header helper. |

Runtime emitters reuse the Generate phase. When runtime code needs a builder, the builder lives in `src/` and `scripts/` imports it — never two implementations of the same output.

---

## Structure rules

1. **One concern per file.** A file named `emit{X}` / `{x}Css` emits one axis. Helpers it alone uses stay module-level in that file; helpers two files use move to a shared module.
2. **Module-level pure functions, not nested closures.** A tree walk takes a callback instead of closing over accumulators. Accumulators are an explicit, documented object passed in.
3. **Share declaration and block builders.** A CSS declaration line (`key: value`, primitive, reassignment) and a block wrapper (`:root`, `@media`, `[data-theme]`) each have exactly one builder, used by build and runtime.
4. **One source for every ordered or enumerated list.** Breakpoint order, theme names, settable keys: one `as const` tuple; types and derived lists (`OVERRIDE_BREAKPOINTS`, unions) come from it.
5. **One generated-file header helper.** No per-file header strings, no timestamps. Headers name the real source paths.
6. **Named types.** No repeated inline shapes (`{ [key: string]: TokenNode }` → `TokenTree`). One shared types module per pipeline.
7. **Name by the verb table above.** `build*` is reserved for small values (keys, configs); it is not a synonym for generate or assemble.

---

## Documentation standard

Model: `nice-styles/scripts/shared/readTokenSources.ts` — module header, per-field JSDoc on every interface (`scripts/shared/types.ts`), JSDoc on every function, phase comments inside the entry function.

### Module header (every generator/emitter file)

```ts
/**
 * {One-line purpose}.
 *
 * {What it emits and why it exists — the problem it solves if non-obvious.}
 *
 * ## Input
 * {Shape of the model slice it reads, with a short example.}
 *
 * ## Output
 * {Which file / section it lands in, and its order relative to siblings.}
 *
 * @example
 * // input
 * { fontSize: { $breakpoints: { laptop: { large: "24px" } } } }
 * // output
 * @media (min-width: 1280px) { :root { --np--font-size--large: var(--np--font-size--large--laptop); } }
 */
```

### Types

Every exported and internal type gets a JSDoc line; every field gets its own JSDoc line stating what it holds and who writes/reads it.

### Functions

JSDoc with purpose, `@param` for each parameter, `@returns`, and `@throws` when it throws. Non-obvious decisions (cascade order, specificity, why a case emits nothing) are documented where the decision is made — rationale, not restatement.

### Inline

Per [`comments.md`](comments.md): one comment per branch, phase, side effect, or non-obvious transform. Generators are commented more densely than runtime code.

### Keep it true

A header or comment that names a file, function, or shape that no longer exists is a defect. Update docs in the same change that renames or removes the thing they describe.

---

## Tests

Non-React packages use `node:test` through `tsx` (no extra dependency). React component packages keep jest — see [`topics/build-config.md`](../topics/build-config.md).

```json
"test": "tsx --test test/*.test.ts",
"test:update": "UPDATE_SNAPSHOTS=1 tsx --test test/*.test.ts"
```

Layout:

```
test/
├── helpers/
│   ├── snapshot.ts      # matchSnapshot(name, content) — file snapshots under __snapshots__/
│   └── dom.ts           # DOM stub for runtime injection tests (when the package injects styles)
├── __snapshots__/       # one plain file per snapshot; diffs read as the generated output
└── {subject}.test.ts
```

Required coverage for a generator package:

| Test | What it guards |
|---|---|
| **Artifact snapshots** | Every generated file in `dist/` (and generated source files) matches its snapshot byte-for-byte. |
| **Runtime fixture snapshots** | Runtime emitters' output for a fixture that covers every value shape. |
| **Behavior tables** | Public getters/services with explicit expected values (not snapshots). |
| **Cross-artifact invariants** | e.g. every seeded registry key is declared in the generated CSS. |

Rules:
- Tests run against the built output — `npm run build` before `npm test` (`prepublishOnly` chains both).
- A snapshot changes only in the commit that intends the output change; run `npm run test:update` and review the snapshot diff as part of the change.
- A refactor step is done when every snapshot is unchanged, or every change is listed and intended.

Reference implementation: `nice-styles/test/`.

---

## Checklist

- [ ] Pipeline phases in separate modules; one normalized model; validation runs once
- [ ] No duplicated declaration/block builders between `scripts/` and `src/`
- [ ] No nested closures holding accumulators; named, documented accumulator types
- [ ] Ordered/enumerated lists come from one tuple
- [ ] Generated-file headers from one helper, naming real sources
- [ ] Module header, per-field type JSDoc, function JSDoc, phase comments
- [ ] `node:test` artifact + runtime snapshots and behavior tables; snapshots unchanged or intentionally updated
