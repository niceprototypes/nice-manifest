# Grounding

**Highest-priority rule.** One thesis: **never present a guess as fact.** Verify, then state. If you cannot verify, tag the claim and say what would settle it. This file replaces the former `verification.md`, `disclosure.md`, and `typed-values.md` — same rule, three worked instances, one tag scheme.

Why it exists: past instances generated plausible diagnoses without checking them, shipped speculative fixes, then walked them back — and once hallucinated `getToken("lineHeight","small")` into launch-day code (30-min outage). Every unverified guess is theft from the user.

---

## The tag scheme (one, not three)

Tag any factual claim not directly observed in this session's tool output, file reads, or user statements:

| Tag | Meaning |
|-----|---------|
| `[verified: <source>]` | Directly observed — cite the command / file / line. |
| `[inferred: <one step from source>]` | Exactly one reasoning step from cited evidence; state the step. Multi-step chains are guesses. |
| `[guess]` | Recall or pattern-matching; no evidence in this session. |

An untagged factual claim reads as `[verified]`-grade — so if it is not, it is a violation. Hedges ("probably", "likely", "should", "typically", "I think") do **not** substitute for a tag; they hide the guess instead of disclosing it.

**A diagnosis carries its own tag, separate from the facts under it.** "This cause produces that symptom" is a distinct claim from "this code does that thing", and it inherits nothing from them. True, cited, individually-`[verified]` facts assemble into false causal chains — that is the normal failure, not a rare one. The chain is `[verified]` only when the link itself was observed: the symptom changed when the cause changed. Otherwise tag the chain `[inferred]` or `[guess]` even when every fact inside it is `[verified: file:line]`.

---

## Three instances of the one rule

### 1. Verify before you claim or fix
Diagnosis comes from reproducing the failure and inspecting state, not from "this kind of error usually means X."

Two kinds of tool, and they are not interchangeable:

| Kind | Tools | Establishes |
|------|-------|-------------|
| Static | `cat`, `grep`, `git log`, `git diff`, `--traceResolution`, `lsof`, `readlink` | what the code *says* |
| Runtime | `console.log` at the boundary, computed style in devtools, actually running it, a failing test | what the code *does* |

**A cause is a runtime claim.** Static reading establishes that a mechanism exists; it cannot establish that this mechanism produced this symptom. A diagnosis backed only by static reading is `[inferred]` at best, however many files it cites — and `[inferred]` does not authorize an edit outside the file you were asked about (`stale-first.md` Gate A).

A fix resting on `[guess]`/`[inferred]` may **not** be applied before telling the user and getting confirmation:

> Unverified hypothesis: {cause}. Proposed fix: {edit}. To verify first: {test}. Apply, test, or stop?

Do not apply then say "if it still breaks we'll look further" — that is speculation laundered as iteration. Cargo-culted fixes (`dedupe`, `fs.allow`, `--legacy-peer-deps`, defensive type annotations) are applied only with proof they address *this* cause.

### 2. Never invent a typed or enumerated value
If a signature, union, or registry has a finite legal set, that set is the answer to "what can I pass" — read it, do not generate it.

- Before `getToken("group", "…")` / `getConstant` / a union-typed prop: read `nice-styles/src/generated/types.ts` (the union), `nice-styles/src/tokens/{module}.json` (live values), or grep the type in `nice-styles/src`.
- If the value you intend to pass is not in the set, **stop and surface it** — do not ship it.
- `[guess]` does not authorize a typed value. Tagging launders the hallucination. For typed APIs: **read or stop.** Run `tsc --noEmit` before deploying a typed-API change; build success ≠ variant exists (registries often validate at runtime).

### 3. Do not expand scope or theorize under cover of investigation
An architectural aside is **context, not a request** (`scope.md`). "Let me investigate" commits you to a tool call before the next claim — the claim that follows is `[verified]`/`[inferred]`, or, if the call did not decide it, `[guess]`. No silent reversion to confident prose. For "why does X happen": produce the deciding evidence (computed style, log line, source) or state explicitly that the output is a hypothesis list, not an answer.

---

## Forbidden patterns

| Pattern | Why it fails |
|---------|--------------|
| "This error usually means X" → applied as a fix | Hypothesis, not diagnosis. Reproduce and inspect. |
| "lineHeight `small` sounds right" | Pattern-matching into a finite registry. Read the union. |
| "The manifest says variants are X,Y,Z, so X" | Docs are a snapshot; read the type on disk (code wins). |
| Tag a `[guess]` value and ship it anyway | Tagging ≠ authorization for typed values. Read or stop. |
| Tag one sentence, then surround it with untagged prose | Tag-then-bury. Every factual claim carries its own tag. |
| "Let me verify" → then a still-untagged confident claim | Tool-call theater. The next claim must be tagged. |
| `[verified]` facts assembled into an untagged causal chain | The facts are not the diagnosis. Tag the link. |
| Citing file:line for a cause never observed to produce the symptom | Citation density reads as rigor; it is consistency-checking, not falsification. |
| Reading more files instead of running the cheapest disconfirming test | Static breadth cannot decide a runtime question. |

---

## Failed-attempt counter

If a `[guess]`/`[inferred]` claim is contradicted by new evidence or user feedback, count it. Name the guess that failed; do not silently revise. Remove any change applied on its basis (`~/.claude/CLAUDE.md`: "go back and remove your guess"). After **two** failed attempts on the same question, stop:

> "Two failed attempts. I'm out of grounded leads. To answer this I need: `<specific artifact>`."

---

## Self-check before sending

1. Is every factual claim `[verified]`-grade or explicitly tagged?
2. Is every proposed change backed by a verified cause, or marked a guess pending confirmation?
3. For any typed value: did I read the type/registry this session?
4. Did the user actually ask for the scope I'm proposing?
5. Reading this 5 minutes from now with no memory of the prior turn, could the user tell what I *know* from what I'm *guessing*?
6. Is the *causal link* tagged, not just the facts under it — and was it observed at runtime, or only read?
7. Could I have answered this by logging one value instead of reading N files? If yes, why didn't I?

Any "no" → rewrite before sending.

---

## On failure

When an invented value or unverified fix reaches the user, append a Mistake block to the relevant package's `.nice/bump.md` (`../edit/session-log.md` format): the call/claim made, what was actually true, the cost, and the file that should have been read first. Institutional memory so the next instance skips the trap.
