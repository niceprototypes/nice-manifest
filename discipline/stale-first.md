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
| 2 | Stale dev server / Vite dep cache (`?v=hash`) | you just renamed / moved a file | `nicely clean` |
| 3 | Un-rebuilt linked package | consumer sees old `dist/` | `nicely build all` (or `build icons`) |
| 4 | Duplicate singleton after a dep change | multiple React / styled-components instances | `nicely dedupe` |
| 5 | **The input never arrives** | "X isn't changing / updating / applying" | **log the value at the boundary** |
| 6 | Your own uncommitted diff | you edited anything this session | `git diff` |
| 7 | The call site | is the prop / arg actually passed? | read the caller |
| 8 | The file you were asked about | — | read it |
| 9 | The package you were asked about | — | read it |
| 10 | A foundation package | everything above is exonerated | **gated — see The Two Gates** |

Steps 1–4 are stale state. Steps 5–10 are the source order — do not enter a step until the one above it is answered.

**Step 5 is the whole rule in one line.** For any "why isn't X changing", confirm X *receives* the value before explaining how X processes it. The mechanism is the interesting answer; the missing input is the usual one. Reach for the mechanism second.

---

## The two gates

**Gate A — a cross-file diagnosis requires a runtime observation.**
A diagnosis pointing outside the file you were asked about may not be acted on from source reading alone. Produce one runtime observation first: a logged value, a computed style, an actual run. Static reading cannot license a cross-package fix, no matter how many files it spans. Fifteen correct file reads and zero observations is not evidence — it is a hypothesis with citations.

**Gate B — an unexplained anomaly is a stop condition.**
If your own account has a piece that does not fit ("the one thing I can't explain is…"), stop. Do not label it a loose end and continue. That sentence is the model reporting its own failure; it outranks the rest of the explanation. Name what does not fit and ask, or go get the observation that settles it.

---

## Highest-suspicion triggers

- The symptom appeared with **no change to the relevant logic**.
- You **just renamed / moved / deleted** a file (the exact case that caused theme #3).
- `"module X does not provide export Y"` right after editing a foundation package → optimizer cache, not code.
- You **added the input this session** — a new prop, arg, or option, especially one with a `??` / `||` fallback. A fallback converts "never passed" into "silently wrong", which presents as a deep bug and is not one.
- Your diagnosis is **more interesting than the symptom**. A one-line symptom with a core-architecture explanation is a smell, not a finding.

---

## Forbidden patterns

| Pattern | Why it fails |
|---------|--------------|
| Grepping source for a link that worked a minute ago before checking the tab | burns tokens on a non-bug |
| Applying a code fix to a stale-cache symptom | fixes nothing; the cache still serves old output |
| Explaining how a mechanism works before checking the mechanism was invoked | answers a question nobody asked; the input was missing |
| Escalating outward — component → package → foundation — on reading alone | each step feels like progress; none of it is evidence (Gate A) |
| "The one thing I can't account for is…" then continuing | the anomaly was the answer (Gate B) |
| Proposing a refactor of the file you have misdiagnosed | scope inherits the wrong diagnosis; blast radius grows with the error |

---

## Self-check

1. Did this work recently with the same code?
2. Did I just rename / move / build something?
3. Have I ruled out the tab and the `nicely clean` / `dedupe` / `build all` triad?

If 1–2 are "yes" and 3 is "no" → **check freshness before reading code.**

Then, before any edit:

4. Have I confirmed the input actually arrives (step 5)?
5. Have I read my own `git diff` (step 6) and the call site (step 7)?
6. Is my diagnosis outside the file I was asked about? → **Gate A: name the runtime observation backing it.** No observation → do not edit; report the hypothesis and the test that would settle it.
7. Does any part of my explanation not fit? → **Gate B: stop.**

Any "no" at 4–6, or "yes" at 7 → **do not edit.**

Cross-reference: `../build/symlinks.md` (the `nicely` triad), the `Configuration/Caches` story.
