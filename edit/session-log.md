# Session Log — Superseded by Bump Files

**The per-day session-log convention is deprecated.** The
`manifest/.nice/sessions/` folder no longer exists. The durable, chronological
record that session logs used to provide is now carried by each package's
`.nice/bump.md` file — one timestamped entry per publishable change, written in
the same commit as the work it describes.

See [`../publish/bump-intent.md`](../publish/bump-intent.md) for the bump-file
format and the `nicely bump` (write entry) / `nicely publish` (consume, commit,
clear) workflow.

---

## What moved

| Old — session log | New — bump files |
|---|---|
| `manifest/.nice/sessions/YYYY-MM-DD.md`, one file per day, workspace-wide | `{package}/.nice/bump.md`, per package, one line per change |
| Paraphrased Q&A "understanding" entries | Imperative commit-message entries (`[YYYY-MM-DD HH:MM] level: message`) |
| Source package tagged inline in the `**Claude:**` marker | Source package is the file's own package — no tag needed |
| Chronology from `HH:MM` stamps within a day file | Chronology from the `[YYYY-MM-DD HH:MM]` prefix on each bump line |

There is no longer a separate "log each resolved question" step. The unit of
record is the **publishable change**, captured at commit time per
`publish/bump-intent.md` → "When to write an entry". Purely internal work
(docs, tests, CI) still needs no entry.

---

## Mistake Reporting

The mistake-self-report rule survives the move. When a Claude instance makes a
mistake during work on a package — wrong diagnosis, failed fix, scope creep,
unauthorized action, broken assumption — it appends a Mistake block to that
package's `.nice/bump.md`, kept distinct from the publishable commit-message
entries (mistake blocks are internal memory, not release notes). They are safe
to keep there: the `nicely` bump parser skips any line not in
`[YYYY-MM-DD HH:MM] level: message` form, so blockquote mistake lines are
ignored by `bump` / `publish` and never reach a commit message or version
calculation.

### Format

```md
> **Mistake:** One-sentence summary of what went wrong.
>
> **Attempts:**
> - Attempt 1: {what was tried, why it was wrong}
> - Attempt 2: {if applicable}
>
> **Actual cause:** {the real root cause, once confirmed}
>
> **Rule for next time:** {the specific change in behavior required to avoid this pattern}
```

### When a mistake qualifies

- Proposed or applied a fix that did not resolve the problem.
- Diagnosed the same problem twice with two different (wrong) causes.
- Made an edit the user did not ask for (scope creep).
- Ran a destructive command without approval.
- Gave advice that contradicted documentation or current code.
- Added complexity (a feature, an abstraction) that turned out to be unnecessary.

State the mistake directly — no apology language, no minimizing. The block is
institutional memory so the next instance avoids the same trap.
