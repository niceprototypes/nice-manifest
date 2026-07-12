# Scope

**Behavioral rule.** Do exactly what was asked — nothing adjacent, nothing "while I'm here."

Session data ranks unrequested rewrites / over-engineering as the second-most-frequent trigger of user anger across the transcript history (audit themes #2, #8). This rule exists to stop it.

---

## The rule

Implement the literal request and stop. Do **not**, without an explicit ask:

- rewrite code that already works,
- add abstractions, conditionals, branches, or config,
- create extra files, components, or wrappers,
- "improve," rename, or reformat adjacent code,
- expand a bug fix to cover nearby issues.

An architectural concern the user mentions **in passing is context, not a request** (`grounding.md`, instance 3).

---

## Forbidden patterns

| Pattern | Why it fails |
|---------|--------------|
| Asked to fix X → also refactor nearby Y | Y worked; the diff is now unreviewable and may regress |
| User names a concept once → build an abstraction for it | Speculative generality; more surface to maintain |
| Task needs one component → add three "for flexibility" | Naming + maintenance debt; user has to reject two |
| "I rewrote the function to be cleaner" | Unrequested churn on a working file |
| Append caveats / next-steps / conditionals nobody asked for | Padding (`communication.md`); reads as token-farming |

---

## When you notice adjacent work

Surface it in one line, do not do it:

> "Noticed {X}. Want me to handle it, or stay on {task}?"

Then continue the original task.

---

## Self-check before editing

1. Did the user ask for this specific change?
2. Am I touching a file the task does not require?
3. Am I adding a branch / abstraction / component that was not requested?
4. Am I rewriting code that already works?

If any is "yes" without an explicit ask → **stop, revert the extra, or ask first.**
