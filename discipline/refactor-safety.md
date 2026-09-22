# Refactor Safety

**Highest-priority rule for AI instances during any multi-edit change.** Read alongside `grounding.md`.

> **This rule is violated more than any other in this manifest.** Instances routinely delete an import before the last reference, pass a prop before the component accepts it, reference a token before it is emitted, or move a file before updating its importers — then discover the break from a red dev server instead of preventing it. If you are about to make more than one edit, this file governs the **order** of those edits. It is not optional and it is not advisory.

The dev server, type checker, HMR, and downstream consumers all observe the working tree continuously. Every save is a potential build event. A change that breaks intermediate states wastes the user's time at minimum and can cascade into HMR resets, lost session state, runtime errors in the browser, and confusing log output that obscures the actual issue.

The CLAUDE.md "Code safety" rule is the seed of this principle:

> Don't delete import statements before you are finished removing all instances of that module, to prevent the build from being temporarily broken while you finish working. Use the same logic for any asset type.

This file generalizes that rule to **both directions** — adding as well as removing — and gives it a sharper edge.

---

## The rule

**Every save must leave the package you are editing in a compiling state.**

Not just the final state. The path matters. If steps 1–3 of a five-step change break the build, the user sees broken HMR, broken types, or runtime errors during steps 1–3 — even though the final commit is clean.

### The one principle underneath all of it

**A name must never point at nothing. At every save, every reference and its referent both exist.**

Everything below is a corollary of this. There are exactly two directions, and they run opposite ways:

- **Adding** → create the **referent first**, then the reference. Build the prop before you pass it. Emit the token before you `var()` it. Create the export before you import it. *Producer before consumer.*
- **Removing** → delete the **references first**, then the referent. Remove every usage before the import. Migrate every caller before the old definition. *Consumer before producer.*

If you can state which direction you are in, you know the order. Get the direction backwards and you have guaranteed a broken intermediate.

---

## Before the first edit: state the order

For any change touching more than one save, **write the ordered edit list before making the first edit** — even one line: `order: add prop to type+impl → wire consumers`. This is the forcing function. The failures this file exists to prevent all happen when an instance starts editing at the consumer (the interesting part) and backfills the definition afterward. Naming the order first makes the direction explicit and catches a backwards plan before it costs a save.

---

## Ordered patterns

### Adding something new — a prop, export, function, type, CSS token, or file (producer before consumer)

The most common change and the most commonly mis-ordered. Anything a consumer will reference must fully exist before the reference does.

| Step | Action | State of the build |
|------|--------|--------------------|
| 1 | Define the thing itself, completely | Definition exists, no consumers yet. Build green. |
| 2 | Add the consumers that reference it | Referent exists before every reference. Build green. |

**"Completely" is load-bearing.** A prop means the field in the props type **and** the runtime handling that reads it — a prop that is typed but not implemented compiles yet silently does nothing, which is its own broken intermediate. A CSS token means the source entry **and** the emitted `var(--np--…)` in the generated output (rebuild if the consumer reads the built file). An export means the symbol **and** its line in the barrel. A file means it exists on disk at the path the importer will use.

**Wrong order:** pass `<Foo bar={…}/>`, write `import { baz }`, or reference `var(--np--new)` before `bar` / `baz` / the token exists → the consumer points at a name that resolves to nothing: a type error, an undefined import, or a dead CSS variable. This is the "adding a prop before you've built it" failure — it happens because the consumer is the interesting edit, so instances start there. Start at the definition instead.

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

Do **not** use `replace_all` for renames in any `nice-*` repository — see CLAUDE.md.

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

## Self-check — a gate, not a suggestion

Run this before the **first** edit of any multi-save change, and again before any delete. If any answer is "no," **reorder before touching the file** — do not edit first and fix the order later.

1. Have I stated the edit order (see "Before the first edit")?
2. Which direction am I in — **adding** (referent first) or **removing** (references first)? Does my planned first edit match that direction?
3. **Adding:** does the thing I'm about to reference already fully exist — typed *and* implemented, exported *and* in the barrel, authored *and* emitted, on disk at the final path?
4. **Removing:** have I deleted every reference (calls, JSX, CSS class, `var()`) before the import / definition / file goes?
5. Will every save between now and the final state leave the package in a compiling state?

A "no" on 2, 3, or 4 means the order is backwards. Reorder — the fix is always to move the definition earlier (when adding) or the deletion later (when removing).

---

## What this rule does not require

- Not a license to refuse a refactor because it's complex. The rule is to **sequence the edits**, not to stop.
- Not a requirement to commit at every intermediate step. The unit of safety is the *save*, not the commit.
- Not a requirement to add backwards-compat shims that outlive the refactor. The intermediate state is temporary; once consumers are migrated, the old goes away.

---

## Honest accounting on failure

If you break the build mid-refactor and the user notices (HMR error, dev-server crash, broken page in the browser), append a Mistake block to the relevant package's `.nice/bump.md` per `../edit/session-log.md` with:

- The order you used.
- The order you should have used.
- The cost (broken HMR, dev reload, etc.).

This is the institutional memory that lets the next instance avoid the same trap.