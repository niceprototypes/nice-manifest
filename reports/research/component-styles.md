# Component Styles — Split `component.json` per Component

**Date:** 2026-05-27
**Scope:** `nice-styles/src/tokens/component.json`, `module.themes.json`, and the generator scripts that read them.
**Status:** Proposal — not executed.

---

## Why

Two related drifts in `nice-styles/src/tokens/`:

1. **`component.json` predates the `module.{variation}.json` split.** It accumulates seven component prefixes in one 347-line file, with `day` / `night` at the top level (the inverse of how the module files organize variation). The module files codified a cleaner pattern after this file was written: the variation lives in the **filename**, not in a wrapper key.

2. **`module.themes.json` still uses a `day` wrapper key for the base theme.** The base values (today's `day`) are conceptually the unconditional defaults — same role `module.json` plays for non-themed tokens. Wrapping them in a `day` object hides that relationship and forces every reader to peel back one layer to reach the base.

The target end-state for both files: a comprehensive **base** at the top, with alternative themes layered on as **partial overrides** keyed by theme name.

| File (target) | Keyed by | Contents |
|---|---|---|
| `module.json` | nothing | **all base tokens, comprehensive** — static tokens + the values today's `module.themes.json.day` holds |
| `module.themes.json` | alternative theme names (`night`, …) — **no `day` key** | partial overrides; each value has the same shape as `module.json` but only the entries that differ |
| `module.breakpoints.json` | `phone` / `tablet` / `laptop` / `desktop` | breakpoint-conditional tokens (unchanged) |
| `{prefix}.component.json` | nothing | per-component base tokens, comprehensive (same shape as `module.json` but namespaced by component) |
| `{prefix}.component.themes.json` | alternative theme names (`night`, …) | per-component partial overrides |

`component.json` becomes per-component; `module.themes.json` loses its `day` wrapper.

**Naming note** — at the JSON layer, the base theme has *no* wrapper key (`module.json` itself is the base). At every other layer the base theme is still called `day` for now: `DEFAULT_THEME = "day"` in `nice-styles/src/constants/styleValues.ts`, the CSS primitive suffix stays `--day`, `<Theme name="day">` stays valid, `[data-theme="day"]` stays valid, `getConstant(..., { theme: "day" })` stays valid. Renaming the base theme from `"day"` to something neutral (e.g. `"base"`) is a separate exercise — see [Open questions](#open-questions).

---

## Today's drift (verified against the files on 2026-05-27)

### `component.json`

- **Seven** component prefixes side-by-side in one file: `button`, `icon`, `tile`, `typography`, `image`, `input`, `lightbox`.
- Top-level keys are themes (`day`, `night`), inverting the layout used everywhere else.
- Theme-invariant tokens (button's `size` / `spacing` / `borderRadius`) sit under `day`-only, when they belong outside any theme wrapper.
- `night` is sparse — only `button.status` actually varies by theme. Other prefixes have empty or no entries under `night`.

### `module.themes.json`

- Top-level keys are `day` and `night`. The two have identical inner structure (`color`, `backgroundColor`, `borderColor`).
- `day` is the base — every consumer (generator scripts and runtime) treats it as the default that gets reassigned only when `night` matches. The wrapper key is semantically redundant with the file's own existence.
- `night` *should* be a sparse override (most entries mirror `day` with adjusted alpha/lightness), but the current structure encourages repeating every group/variant key. Both themes today happen to be comprehensive, masking the partial-override semantics.

---

## Target layout — confirmed

Flat tokens directory with the `.component.` infix namespacing the new files:

```
styles/src/tokens/
├── breakpoints.json                       (unchanged)
├── module.json                            ← absorbs today's `module.themes.json.day`
├── module.themes.json                     ← keyed by alternative themes only (`night`, …)
├── module.breakpoints.json                (unchanged — breakpoint-keyed module tokens)
├── button.component.json                  ← base button tokens (incl. theme-varying values at base)
├── button.component.themes.json           ← keyed by alternative themes only (`night`, …)
├── icon.component.json
├── tile.component.json
├── typography.component.json
├── image.component.json
├── input.component.json
└── lightbox.component.json
```

### `module.json` (after the merge)

Today's `module.json` contents (animationDuration, borderRadius, fontWeight, gap, lineHeight, etc.) **plus** the contents of today's `module.themes.json.day` (`color`, `backgroundColor`, `borderColor`):

```json
{
  "animationDuration": { "base": "300ms", "slow": "600ms" },
  …
  "color": {
    "base":     "hsla(210, 5%, 5%, 1)",
    "light":    "hsla(210, 5%, 25%, 1)",
    "lighter":  "hsla(210, 5%, 50%, 1)",
    "lightest": "hsla(210, 5%, 75%, 1)",
    …
  },
  "backgroundColor": { "base": "hsla(0, 5%, 100%, 1)", "dark": "hsla(0, 5%, 95%, 1)" },
  "borderColor":     { "base": "hsla(240, 9%, 91%, 1)", "dark": "hsla(210, 8%, 58%, 1)", "darker": "hsla(210, 10%, 20%, 1)" }
}
```

No `day` wrapper. The file IS the base theme — same as how `module.json` already plays the base role for non-themed tokens.

### `module.themes.json` (after the merge)

Top-level keys are alternative theme names. No `day` key — the day-content is now the base in `module.json`. Each alternative-theme value has the same shape as `module.json` but contains only the entries that differ from the base:

```json
{
  "night": {
    "color": {
      "base":     "hsla(210, 5%, 95%, 1)",
      "light":    "hsla(210, 5%, 95%, 0.85)",
      …
    },
    "backgroundColor": { "base": "hsla(240, 5%, 15%, 1)", "dark": "hsla(240, 5%, 12.5%, 1)" },
    "borderColor":     { "base": "hsla(240, 5%, 25%, 1)", "dark": "hsla(240, 5%, 50%, 1)", "darker": "hsla(240, 5%, 100%, 1)" }
  }
}
```

Adding a future theme (e.g., `high-contrast`) means appending another top-level key with a partial override — no schema change.

### Shape rules

Codify the asymmetry between base and alternative themes:

- **Base (`module.json`, `{prefix}.component.json`) — comprehensive.** Every token name/variant that any alternative theme references must exist at base. The base file is the index of "every variant this theme system can address."
- **Alternative themes (`module.themes.json[name]`, `{prefix}.component.themes.json[name]`) — partial.** May contain a subset; whatever is omitted falls through to the base value at runtime. An alternative theme MUST NOT introduce a token group or variant that does not exist in the base — the base is the registration site.

Enforced by the existing `validateNightTokens` / `validateComponentNightTokens` step in `nice-styles/scripts/generateCss/readSources.ts` and `nice-styles/scripts/css/validate.ts`. Generalize the validator names to `validateAlternativeThemeTokens` and run it once per alternative theme key (today just `night`, future arbitrary).

---

## Content split per component

Mirrors the new `module.json` vs `module.themes.json` shape exactly.

`button.component.json` — the **base** for button. Contains everything button needs at the default theme, including the parts that *do* vary by theme (using their base values):

```json
{
  "size":         { "smaller": "var(--np--cell-height--smaller)", … },
  "spacing":      { "smaller": "calc(var(--np--cell-height--smaller) / 2)", … },
  "borderRadius": { "smaller": "var(--np--border-radius--smaller)", … },
  "status": {
    "primary":   { "base": { … }, "disabled": { … }, "error": { … }, "success": { … }, "warning": { … } },
    "secondary": { "base": { … }, … }
  }
}
```

`button.component.themes.json` — alternative themes only. No `base` key. Each theme value has the same shape as `button.component.json` and contains only the entries that differ:

```json
{
  "night": {
    "status": {
      "primary": { … },
      "secondary": { … }
    }
  }
}
```

Components with no theme variation (icon, tile, typography, image, input, lightbox today) get **only** the `*.component.json` file. No empty themes shells.

Future-proofs symmetrically: if button gains a breakpoint-conditional token, it lands in `button.component.breakpoints.json` (keyed by `tablet`/`laptop`/`desktop` — `phone` is the base, lives in `button.component.json`).

---

## How the module files are already discovered — and why components should diverge

Two readers consume the module files today, and both use **hardcoded `path.join(...)` calls — one line per file, no glob, no registry**. From `nice-styles/scripts/generateTokens/readSources.ts`:

```ts
const core = readJson<TokenMap>(path.join(tokensDir, 'module.json'))
const color = readJson<DimensionMap>(path.join(tokensDir, 'module.themes.json'))
const size = readJson<DimensionMap>(path.join(tokensDir, 'module.breakpoints.json'))
const breakpoints = readJson<BreakpointsJson>(path.join(tokensDir, 'breakpoints.json'))
```

`generateCss/readSources.ts` follows the same pattern. The "registry of which files exist" is the script source itself.

That works for module-level files because the set is small and fixed (a handful of variation types: static, themes, breakpoints). It does **not** scale to the per-component layout, which will start at 8 files today (7 statics + 1 themes for button) and grow as packages are added.

**Recommendation: glob per-component files, keep hardcoded module reads.** Two rules at two scopes:

| Scope | Discovery |
|-------|-----------|
| Module variations (small fixed set) | Hardcoded `path.join` per file — what the scripts do today. |
| Component files (variable count, one per package) | Glob `tokensDir/*.component.json` and `tokensDir/*.component.themes.json` — filename stem is the prefix. |

This keeps the existing module reads untouched while letting the component layer scale without script edits.

### Generator-script changes

Three scripts read the relevant files today:

- `scripts/generateTokens/readSources.ts` → produces `src/generated/componentTokensData.ts`
- `scripts/generateCss/readSources.ts` → produces `dist/tokens.css`
- `scripts/generateTypes/readSources.ts` → derives `ComponentPrefix` from the keys of `component.json.day`

Two distinct shape changes each script needs to absorb:

**Theme-base merge (module files):**

- `module.json` is now the full base — read directly into the merged tokens map. The current `themesDay` extraction (`themesJson.day || {}`) goes away.
- `module.themes.json` is now `Record<themeName, Partial<TokenMap>>` — iterate alternative themes and emit each as a sparse override block. Today's `themesJson.night || {}` becomes `themesJson.night` (or whatever themes are present); the code stops asking for `themesJson.day` entirely.

**Component split:**

- Drop the `component.json` read entirely.
- Glob `*.component.json` → static/base bucket; filename stem before `.component` is the prefix.
- Glob `*.component.themes.json` → `{ [theme]: PartialPrefixData }`; merge by prefix.
- `ComponentPrefix` union derived from the union of filename stems (instead of `Object.keys(component.day)`).

Internal data model after both changes:

```ts
{
  [prefix: string]: {
    base: <module.json shape namespaced under one prefix>,
    themes?: { [themeName: string]: PartialOfBase },
    breakpoints?: { tablet?: ..., laptop?: ..., desktop?: ... },  // phone lives in base
  }
}
```

This parallels the module-level shape exactly: `base = module.json`, `themes = module.themes.json[name]`, `breakpoints = module.breakpoints.json[name]`. One rule applied at two scopes.

---

## Migration steps

Two refactors. Do the **theme-base merge first** (smaller surface, validates the conceptual shift) and the **component split second** (mechanical, leverages the new shape). Each follows `discipline/refactor-safety.md` — every intermediate save leaves the build green.

### Phase 1 — theme-base merge

1. **Add the new module/themes shape next to the old one.** Write `module.next.json` = today's `module.json` merged with `module.themes.json.day`. Write `module.themes.next.json` = `{ "night": <today's module.themes.json.night> }`. Old files untouched. Generators still read the old files. Build unchanged.
2. **Update the three generators.** Each one's `readSources.ts` reads the new files, falling back to the old files if the new ones are absent (so this commit lands cleanly). After the change, all three sources of truth — types, data, CSS — produce identical output to the prior build.
3. **Diff the build output.** Rebuild; confirm `dist/tokens.css`, `src/generated/tokensData.ts`, and `src/generated/types.ts` are byte-equivalent (up to JSON key ordering).
4. **Swap the files.** Rename `module.next.json` → `module.json` and `module.themes.next.json` → `module.themes.json` (overwriting the old contents). Drop the fallback branch in generators.
5. **Rebuild and diff again.** Final confirmation.

### Phase 2 — component split

6. **Add the per-component files alongside `component.json`.** Programmatically split into 7 `*.component.json` (+ button's `*.component.themes.json`), shaped per the new convention: base content lives at the top of `.component.json`; night overrides live under `night` in `.component.themes.json`. `component.json` stays untouched. Build unchanged.
7. **Update the three generators to glob the new layout.** Component-prefix derivation moves from `Object.keys(componentJson.day)` to filename-stem extraction. Keep the `component.json` fallback for one commit.
8. **Diff the build output.** Same equivalence check.
9. **Delete `component.json`** and the fallback. Build green.
10. **Manifest update.** `read/styles/tokens.md` "Component Tokens" and "Themes" sections get the new layout diagram. Mode/theme terminology aligned with the new base/alternative model.
11. **Bump entry.** `patch` on nice-styles (internal restructure; dist byte-equivalent) per `publish/bump-intent.md`'s "Internal refactor with no consumer-visible effect" row.

---

## Non-goals

- **Base theme name** — stays `"day"` everywhere outside of JSON wrapper keys. No rename of `DEFAULT_THEME`, no rename of the `--day` CSS primitive suffix, no rename of `<Theme name="day">`, no rename of the `getConstant({ theme: "day" })` arg. Deferred — see [Open questions](#open-questions--deferred).
- **`getComponentToken()` runtime API** — unchanged.
- **`dist/tokens.css` output** — byte-equivalent (up to ordering).
- **Component packages** — they consume `getComponentToken(prefix, …)` and never touch the source JSON.

---

## Open questions — deferred

### Renaming the base theme from `"day"` to a neutral name

Outside the scope of this report. Today the base theme is called `"day"` at every non-JSON layer:

- `DEFAULT_THEME = "day"` in `nice-styles/src/constants/styleValues.ts`
- CSS primitive suffix `--day` in `dist/tokens.css`
- `<Theme name="day">` / `[data-theme="day"]` attribute
- `getConstant(token, variant, { theme: "day" })` arg
- Five `var(--np--color--day)` cross-references inside `component.json` itself

A future rename ("day" → "base", or some other neutral term) needs to land all five at once. It is **explicitly deferred** by this proposal — the JSON merge here does not touch the name. The day-content moves into `module.json` and the `day` wrapper key disappears, but everywhere else `"day"` still names the base theme.

When the rename does land, the conceptual model is already in place (this proposal): the base is the comprehensive default and lives unwrapped; alternatives are partial overrides keyed by name. The rename then becomes a mechanical sweep of the five surfaces above.

### `mode` → `theme` terminology cleanup

The Tool.tsx change recently renamed the React prop `mode` → `theme`. `module.themes.json`, `ThemeType`, and the `Theme` component already use the new vocabulary. Any remaining `mode` references (variable names, JSDoc, manifest prose) should follow. Likely a separate cleanup pass.

---

## Resolved decisions

### 1. Layout — flat with `.component.` infix (confirmed)

See "Target layout" above.

### 2. Empty `night` shells — drop entirely

When a component has no theme-conditional tokens (icon, tile, typography, image, input, lightbox today), **omit the themes file entirely**. The absence of `icon.component.themes.json` is itself the signal.

Why "drop":

- **Matches the module convention.** `module.themes.json` exists because some module-level tokens vary by theme. If none did, the file wouldn't exist; we wouldn't keep an empty shell. The same rule applies per component.
- **Generator semantics already handle absence.** Merging is partial — anything not present in the themes file is theme-invariant. Empty shells produce identical output to no file, so they add no information.
- **Today's data confirms it.** Only `button` appears under `night` in `component.json` (verified: `night: ['button']`). The other six prefixes are already absent. The migration honors that fact instead of fabricating empty entries.
- **Naming-as-documentation.** When you scan the tokens directory, the presence of `button.component.themes.json` and the absence of `icon.component.themes.json` is the source of truth for "button varies by theme, icon doesn't." Empty shells would dilute that signal — six files all containing `{ "day": { "icon": {} }, "night": { "icon": {} } }` looks like meaningful data but isn't.

If someone later adds a theme-conditional token to icon, they create `icon.component.themes.json` at that moment. No prep needed.

A consequence worth naming: tokens for the **same component** are split across two files based on whether they vary by theme. `button.size` lives in `button.component.json`; `button.status` lives in `button.component.themes.json`. This is the module pattern applied at component scope — `module.json` holds theme-invariant module tokens; `module.themes.json` holds theme-conditional module tokens. The split is by variation axis, not by component.

### 3. Discovery — glob the component files, keep the modules hardcoded

Resolved in "How the module files are already discovered" above. The module readers stay literal (one `path.join` per file, matching today's `readSources.ts`). The component readers glob `*.component.json` + `*.component.themes.json` (and `*.component.breakpoints.json` when that arrives) so new component packages are picked up without script edits. Component prefix = filename stem before `.component`.
