# Refactor Safety

**Highest-priority rule for AI instances during cross-file refactors.** Read alongside `verification.md`.

The dev server, type checker, HMR, and downstream consumers all observe the working tree continuously. Every save is a potential build event. A refactor that breaks intermediate states wastes the user's time at minimum and can cascade into HMR resets, lost session state, runtime errors in the browser, and confusing log output that obscures the actual issue.

The CLAUDE.md "Code safety" rule is the seed of this principle:

> Don't delete import statements before you are finished removing all instances of that module, to prevent the build from being temporarily broken while you finish working. Use the same logic for any asset type.

This file generalizes that rule and gives it a sharper edge.

---

## The rule

**Every save must leave the project in a compiling state.**

Not just the final state. The path matters. If steps 1–3 of a five-step refactor break the build, the user sees broken HMR, broken types, or runtime errors during steps 1–3 — even though the final commit is clean.

---

## Ordered patterns

### Replacing a symbol (function, type, component)

| Step | Action | State of the build |
|------|--------|--------------------|
| 1 | Add the new symbol alongside the old | Both exist. Build green. |
| 2 | Migrate every consumer to the new symbol | Old still exists, callers reference new. Build green. |
| 3 | Remove the old definition and its exports | Old gone, no callers. Build green. |

**Wrong order:** delete the old in step 1 → every consumer is broken until step 3.

### Removing a usage of a module / asset

| Step | Action | State of the build |
|------|--------|--------------------|
| 1 | Remove every reference (calls, JSX usage, CSS class) | Import unused but harmless. Build green. |
| 2 | Remove the import statement | File has zero references and zero imports. Build green. |

**Wrong order:** delete the import first → every reference becomes a TS / runtime error.

### Renaming a function or component

Use the duplicate-then-delete pattern (already in CLAUDE.md):

| Step | Action |
|------|--------|
| 1 | Duplicate the function with the new name |
| 2 | Update every call site to the new name |
| 3 | Delete the original |

Do **not** use `replace_all` for renames in this codebase — see CLAUDE.md.

### Splitting one file into many

| Step | Action |
|------|--------|
| 1 | Create new files with re-exported symbols, keep the old file's exports as re-exports of the new locations |
| 2 | Migrate consumers to import from the new files |
| 3 | Delete the old file |

If splitting and the old file is also a runtime entry point (e.g., has top-level side effects like a registry init loop), the side effects must move to one of the new files **before** the old file is deleted.

### Moving a file in a watched tree

`git mv` is fast enough that the broken window is typically < one save cycle. Acceptable. But:

- Update every importer in the same operation if relative paths shift.
- Run a quick `grep` for the old path before committing.

---

## When breaking the build is acceptable

- The user has explicitly authorized a flag-day cutover.
- The watcher and HMR are confirmed not running, and the user is not actively testing.
- The change is atomic enough that the broken window is < one save cycle (e.g., a single `git mv`).

If none of these hold, take the extra step.

---

## Self-check before any cross-file refactor

1. Did I create the replacement before I deleted the original?
2. Did I migrate all consumers before deleting the original definition?
3. Did I remove all references before removing the import?
4. Will every save between now and the final state leave the project in a compiling state?

If any answer is no, **reorder before continuing**.

---

## What this rule does not require

- Not a license to refuse a refactor because it's complex. The rule is to **sequence the edits**, not to stop.
- Not a requirement to commit at every intermediate step. The unit of safety is the *save*, not the commit.
- Not a requirement to add backwards-compat shims that outlive the refactor. The intermediate state is temporary; once consumers are migrated, the old goes away.

---

## Honest accounting on failure

If you break the build mid-refactor and the user notices (HMR error, dev-server crash, broken page in the browser), append a Mistake block to the current session log entry per `../edit/session-log.md` with:

- The order you used.
- The order you should have used.
- The cost (broken HMR, dev reload, etc.).

This is the institutional memory that lets the next instance avoid the same trap.