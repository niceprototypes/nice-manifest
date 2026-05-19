# Typed Values

**Highest-priority rule for AI instances writing calls into typed APIs.** Read alongside `verification.md` and `disclosure.md`.

This rule exists because a Claude instance hallucinated `getToken("lineHeight", "small")` and `getToken("backgroundColor", "lighter")` into production website code on launch day. Both variant names looked plausible. Neither existed in the registry. The site threw at module evaluation and stayed broken for 30+ minutes across multiple deploys while the failure mode was tracked back to invented values.

The point: **in strongly typed code, the legal values are precomputed and sitting on disk.** Generating a value rather than reading it is choosing local-token-cheapness over correctness, and the cost is asymmetric — a few tokens saved on the read, a launch-day outage paid by the user.

---

## The rule

**Never invent a value that has an enumerated type or a registry definition.**

If a function signature, type union, or registry has a finite set of legal inputs, those inputs are the answer to "what can I pass here?" The answer comes from reading the type or registry file, not from generating a plausible-sounding string.

This applies to, at minimum:

- Token registries (`getToken`, `getComponentToken`, `getConstant`, etc.)
- Union-typed props on components (`size`, `color`, `mode`, `variant`)
- Enum constants
- Config keys with documented allowed values
- Any API where the legal arguments are statically declarable

---

## Required behavior

### 1. Read the type or registry before writing the call

Before writing `getToken("group", "variant")`:

- Read `nice-styles/src/generated/types.ts` for the variant union, OR
- Read `nice-styles/src/tokens/{module}.json` for the live values, OR
- Grep for the type name in `nice-styles/src/`

If the variant you are about to pass is not in the union, **do not pass it**. Stop and surface what you found, what you intended to pass, and ask the user to choose from the legal set.

### 2. The type is the answer — not the manifest, not training data

The manifest's documented variant lists (`read/styles/tokens.md`) are a snapshot. Code on disk is the source of truth. If they disagree, code wins, manifest gets fixed (per `read/audit.md` → "Documentation contradicts code → fix documentation").

Pattern-matched recall — "lineHeight usually has a small" — is not knowledge of this codebase. It is generation. Treat it the same as `[guess]` per `disclosure.md`.

### 3. Run typecheck before deploying typed-API changes

```bash
tsc --noEmit
```

If the call site does not compile, **do not deploy.** If `getToken`'s signature in this project widens variant names to `string` (and so accepts garbage at compile time), that is itself a finding — surface it to the user, do not fill the gap with a guess.

### 4. Tagging a guess does not authorize the guess

`disclosure.md` requires every guess to be tagged `[guess]`. That rule is necessary but not sufficient for typed APIs. A `[guess]` token-variant name is still a hallucination — the correct response is to read the type, not to ship a tagged guess and hope the runtime catches it.

For typed values: read or stop. Do not propose tagged guesses.

---

## Forbidden patterns

| Pattern | Why it fails |
|---------|--------------|
| "lineHeight `small` sounds right for headings" | Pattern-matching from CSS knowledge into a finite registry. The legal set is enumerable; consult it. |
| "The manifest says variants are X, Y, Z, so I'll use X" | The manifest is a doc snapshot. Read the type file, not the doc. |
| "I'll guess `condensed`, mark it `[guess]`, ship it" | Tagging launders the hallucination. Read or stop. |
| "Build passed, so the variant must be valid" | Token registries often validate at runtime, not compile time. Build success ≠ variant exists. |
| "I'll use it because it failed silently last time" | Silent failure is not permission. The next deploy may surface it under load. |

---

## Self-check before any typed-API call

1. Is the variant name I am about to write something I observed in a file read in this session?
2. If not, did I read the type definition or registry source before writing?
3. If the call does not compile under `tsc --noEmit`, am I about to deploy it anyway?
4. Am I treating manifest documentation as a substitute for the type on disk?

If any answer is no, **stop and read the source**.

---

## Honest accounting on failure

When an invented value reaches production and breaks the build or the runtime, append a Mistake block to the current session log entry per `../edit/session-log.md` with:

- The call that was hallucinated.
- What was actually in the registry.
- The cost (broken page, broken deploy, user-visible error duration).
- The specific file (type or registry) that should have been read first.

This is the institutional memory that keeps the next instance from repeating the same trap.