# Combine Theme Files — Fold `*.themes.json` Into Their Parent

**Date:** 2026-05-27
**Scope:** `nice-styles/src/tokens/module.themes.json`, `*.component.themes.json`, and the generator scripts that read them.
**Status:** Proposal — not executed.
**Prior context:** [`component-styles.md`](component-styles.md) — established the comprehensive-base + partial-alt-theme convention and the per-component file split. This proposal is the next step: fold each `*.themes.json` back into its parent so each module / component is one file.

---

## Why

After the [`component-styles.md`](component-styles.md) migration, the tokens directory looks like:

```
nice-styles/src/tokens/
├── module.json                       ← comprehensive base
├── module.themes.json                ← { night: {...} } only
├── module.breakpoints.json           ← unchanged
├── breakpoints.json                  ← unchanged
├── button.component.json             ← per-prefix base
├── button.component.themes.json      ← per-prefix alt themes
├── icon.component.json
├── …
```

Each module/component is now spread across **two** files (base + alt themes). The split was justified during the migration as a literal mirror of `module.json` / `module.themes.json`, but in practice:

- Editors hop between two tabs to evolve a single component's theming.
- The number of files grows linearly with components × variation-axes.
- For components with no alt-theme overrides (icon, tile, typography today), the `.themes.json` file doesn't exist — which is its own kind of irregularity (some components have one file, some have two).

Folding alt themes back into the parent file gives every module/component a single source-of-truth file.

## Constraints

User-stated, recorded here verbatim:

1. The base theme (today `"day"`) is the first / primary entity in the file.
2. The base must contain **all** theme tokens (so partial themes can be derived from it).
3. Subsequent alt themes are tagged by name (`"night"`, future custom names).
4. Alt themes may be partial — missing entries fall through to the base at runtime.

JSON-spec caveat that shapes the design:

> JSON objects are spec-unordered. Every mainstream parser preserves insertion order in practice, but pretty-printers, schema tools, and external integrations re-sort. **Any shape that depends on "first key wins" as a semantic signal is one rogue formatter away from silent regression.**

The viable shapes either tag the base explicitly or namespace it structurally.

---

## Approaches

### Approach A — Reserved sibling key `$themes` (recommended)

Base tokens at the top level of the file (exactly the shape `module.json` has today). Alt themes nest under a single reserved key.

```json
{
  "color":           { "base": "hsla(210, 5%, 5%, 1)", "light": "...", ... },
  "backgroundColor": { "base": "...", "dark": "..." },
  "borderColor":     { "base": "...", "dark": "...", "darker": "..." },
  "gap":             { "none": "0", "smaller": "4px", ... },
  "$themes": {
    "night": {
      "color":           { "base": "hsla(210, 5%, 95%, 1)", "light": "..." },
      "backgroundColor": { "base": "..." }
    }
  }
}
```

**Pros**
- Base reads as a flat token map — zero migration cost for the base content; today's `module.json` is already this shape.
- Order-independent. The reserved key is unambiguous regardless of where it appears in the file.
- Adding a theme = add one key inside `$themes`. Adding a base group = add a key at the top level. Concerns don't touch each other.
- One magic key per file, namespaced by `$` prefix to make it visually distinct from token groups.

**Cons**
- Top level mixes "token groups" with a "theme container" — slight visual irregularity.
- Collision risk if a token group is ever named `themes` or `$themes`. Sigil + schema reservation makes collision impossible by rule.

### Approach B — Sigil-prefixed alt-theme keys

Base tokens at the top level; each alt theme is a sibling top-level key prefixed with a sigil.

```json
{
  "color":           { ... },
  "backgroundColor": { ... },
  "borderColor":     { ... },
  "gap":             { ... },
  "@night": {
    "color": { ... }
  }
}
```

**Pros**
- Completely flat — no nested wrapper.
- Each alt theme is a single top-level entry, easy to grep / copy / move between files.

**Cons**
- Multiple magic-prefixed keys at the top level — more naming-convention surface than Approach A.
- Strict rule: no token group may start with `@`. Easy to enforce; one more rule to remember.
- Per-theme additions scatter across the top level instead of grouping under one container — slightly harder to "see all themes in this file at a glance."

### Approach C — Array of named theme blocks

The file is a JSON array. First entry is base; subsequent entries carry a `$name` tag.

```json
[
  { "color": { ... }, "backgroundColor": { ... }, "borderColor": { ... }, "gap": { ... } },
  { "$name": "night", "color": { ... } }
]
```

**Pros**
- Order is explicit (arrays are ordered in JSON spec, unlike objects).
- "First entry is base" is naturally encoded.

**Cons**
- Arrays are awkward for token data. Every reader walks by index and looks up by `$name`.
- `$name` sigil mixes with token group keys within the same object — small noise penalty per theme.
- Token tooling (JSON-schema validators, IDE autocomplete) handles objects better than arrays-of-objects with conditional shapes.

### Approach D — Two-section pattern

Named sections for base and alt themes:

```json
{
  "base": {
    "color":           { ... },
    "backgroundColor": { ... }
  },
  "alt": {
    "night": { "color": { ... } }
  }
}
```

**Pros**
- Maximally explicit — no ambiguity about what's base vs alt.

**Cons**
- Re-wraps the base, contradicting the prior cleanup that deliberately unwrapped it.
- Two layers of nesting before reaching token groups.

---

## Comparison

| Approach | Base shape | Order-independent | Magic surface | Verbosity |
|---|---|:---:|---|:---:|
| A — `$themes` sibling | flat at top | yes | 1 reserved key | low |
| B — `@theme` sibling keys | flat at top | yes | sigil prefix rule | low |
| C — array of blocks | first array entry | by spec | `$name` per entry | medium |
| D — two sections | wrapped under `base` | yes | 2 reserved keys | medium |

**Recommendation: Approach A.** Costs one reserved key (`$themes`), keeps the base in the shape `module.json` already has, and gives alt themes a single tidy container. Approach B is the runner-up if zero nesting matters more than a single grouped container.

---

## Densification — script to fill in partial themes with null

Orthogonal to the shape choice. Any of A–D pairs with such a script.

The idea: alt themes are partial in source, but a densifier walks the base, fills in every missing key on each alt theme with `null` (or `undefined` sentinel), and writes the result back. Runtime treats `null` as "fall through to base."

### Flavor 1 — build-time densification

Script runs as part of `npm run build` (or a dedicated `npm run densify`).

**Pros**
- Editor sees the full key set on every theme — autocomplete works on every variant.
- Validation catches typos eagerly (an unknown key in a "filled-in" theme stands out as a member of a known shape, vs. silently being a sparse-state miss).
- Self-documenting source — readers see every variant the theme could in principle override.

**Cons**
- Theme files balloon to the size of the base.
- Diffs noisier on theme edits — touching one variant shows that variant; touching a base variant cascades a null entry into every alt theme.
- Cross-theme edits create more merge conflicts.

### Flavor 2 — lint-time / dev-time densification

Developers run `npm run densify` manually before committing, or in a pre-commit hook that re-sparsifies after edit. Same autocomplete benefit while editing; committed files stay sparse.

**Cons**
- Round-tripping is friction: `densify → edit → sparsify → commit` is more steps than dropping a key in.
- Easy to forget the sparsify step.

### Flavor 3 — type-driven autocomplete, no densification

Emit a TypeScript type for each theme file from the base shape. The IDE drives autocomplete from the type. JSON stays sparse.

**Pros**
- Zero file-churn cost. Source stays minimal.
- Autocomplete still works while editing the sparse JSON.

**Cons**
- Type emission needs its own pipeline step.
- Slightly indirect — the editor's autocomplete depends on a generated type rather than the file itself.

### Flavor 4 — JSON Schema for autocomplete, no densification

Emit a JSON Schema from the base shape; configure the IDE's `json.schemas` setting to apply it to `*.component.json` / `module.json`. IDE autocomplete works on the raw sparse JSON.

**Pros**
- Same zero-churn benefit as Flavor 3.
- IDE-native — VS Code, JetBrains, etc. all consume JSON Schema natively. No custom tooling.

**Cons**
- One more generated artifact in the tokens pipeline.
- Schema-generation logic to maintain.

**Recommendation on densification**: don't densify the source. Use Flavor 3 (type-driven) or Flavor 4 (schema-driven) for autocomplete. Densification is a heavier solution to a problem that types/schemas solve cleaner.

If densification is the chosen path anyway, do **build-time only** (Flavor 1) — keep the source-of-truth sparse and let the densified shape be a generated artifact never committed.

---

## Migration sketch (assuming Approach A)

Two refactors, sequenced per `discipline/refactor-safety.md`:

### Phase 1 — module-level

1. Merge `module.themes.json` into `module.json` under a `$themes` key. Write `module.next.json` (combined) next to the originals.
2. Update generator readers to prefer the merged file, fall back to the old split shape.
3. Rebuild; confirm `dist/tokens.css` and `src/generated/*.ts` are byte-equivalent to baseline.
4. Swap: rename `module.next.json` → `module.json`. Delete `module.themes.json`.
5. Drop the fallback branch in readers.

### Phase 2 — component-level

6. For each `{prefix}.component.themes.json`, merge into `{prefix}.component.json` under a `$themes` key. Write `.next.json` alongside.
7. Update generator component-readers to prefer the merged file.
8. Rebuild + diff.
9. Swap files; delete `{prefix}.component.themes.json`.
10. Drop the fallback.

### Phase 3 — autocomplete enablement (optional)

11. Pick Flavor 3 (TypeScript type) or Flavor 4 (JSON Schema). Add the generator step.
12. Configure the IDE setting (or document it in `manifest/edit/component.md`).

---

## Non-goals

- **Base theme name** — stays `"day"` everywhere outside JSON wrapper keys. See [`component-styles.md` § Non-goals](component-styles.md).
- **`getComponentToken()` runtime API** — unchanged.
- **`dist/tokens.css` output** — byte-equivalent (up to ordering).

---

## Open questions

1. **Approach A vs B** — both are equally viable structurally; A groups alt themes under one container, B scatters them at the top level. Preference?
2. **Densification flavor** — type-driven (3), schema-driven (4), or no autocomplete tooling at all? My recommendation is Flavor 4 (JSON Schema) — it's IDE-native and works without any custom build-time logic running during development.
3. **Schema reservation** — if Approach A: what's the canonical reserved key? `$themes`, `themes`, `__themes__`. `$themes` is the most-common JSON-tool sigil convention.
