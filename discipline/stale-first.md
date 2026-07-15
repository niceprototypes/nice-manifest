# Stale-First Diagnosis

**Behavioral rule.** Before investigating code for a "broken" symptom, rule out stale state.

The single biggest token sink across the session history is debugging a non-bug — a stale dev server, an un-rebuilt linked package, or a stale browser tab (audit theme #3). The remedies already exist, scattered across `../build/symlinks.md` and `../read/styles/breakpoints.md`; this file is the "check this first" gate that makes them fire.

---

## The rule

When something that worked moments ago "just broke" — a link, token, style, import, or component — **suspect stale state first**, especially right after *your own* file rename/move or a linked-package edit. Verify freshness before reading source.

---

## Check order (cheapest first)

| # | Suspect | Tell | Fix |
|---|---------|------|-----|
| 1 | Stale browser tab | worked seconds ago, no logic changed | hard-reload (Cmd-Shift-R) |
| 2 | Stale dev server / Vite dep cache (`?v=hash`) | you just renamed / moved a file | `nicely --clean` |
| 3 | Un-rebuilt linked package | consumer sees old `dist/` | `nicely --build-all` (or `--build-icons`) |
| 4 | Duplicate singleton after a dep change | multiple React / styled-components instances | `nicely --dedupe` |
| 5 | Only after 1–4 are clear | — | **then** read the source |

---

## Highest-suspicion triggers

- The symptom appeared with **no change to the relevant logic**.
- You **just renamed / moved / deleted** a file (the exact case that caused theme #3).
- `"module X does not provide export Y"` right after editing a foundation package → optimizer cache, not code.

---

## Forbidden patterns

| Pattern | Why it fails |
|---------|--------------|
| Grepping source for a link that worked a minute ago before checking the tab | burns tokens on a non-bug |
| Applying a code fix to a stale-cache symptom | fixes nothing; the cache still serves old output |

---

## Self-check

1. Did this work recently with the same code?
2. Did I just rename / move / build something?
3. Have I ruled out the tab and the `nicely --clean` / `--dedupe` / `--build-all` triad?

If 1–2 are "yes" and 3 is "no" → **check freshness before reading code.**

Cross-reference: `../build/symlinks.md` (the `nicely` triad), the `Configuration/Caches` story.
