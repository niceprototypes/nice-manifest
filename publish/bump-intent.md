# Bump Intent

Each publishable Nice ecosystem package records pending semver intent in
`.nice/bump.md` at the package root. Each entry's text doubles as a
**commit subject**: `nicely bump` appends an entry, you commit it with
plain `git` alongside the change it describes, and `nicely publish` later
reads every entry to recommend a bump level and clears the file on a
successful publish.

This removes guesswork at commit and publish time — the information lives
next to the code that changed, and neither the person committing nor the
person publishing has to reconstruct what warranted the change.

> The toolkit no longer wraps `git commit` — the old `nicely --commit` was
> removed. Committing is plain `git`; `nicely bump` only records intent and
> `nicely publish` makes its own version-bump commit.

---

## Format

Plain text. One entry per line. Bracketed timestamp, level, colon,
commit message:

```
[2026-04-25 21:50] major: Rename breakpoint identifiers small/medium/large to phone/tablet/laptop and add desktop
[2026-04-25 21:51] minor: Add useBreakpoint hook
[2026-04-25 21:52] patch: Re-export BREAKPOINT_* constants
```

| Field | Meaning |
|-------|---------|
| `[YYYY-MM-DD HH:MM]` | Timestamp, in local time. Written automatically by `nicely bump`. Direct edits should match the format. |
| `✓` (legacy) | A consumed marker written by the removed `nicely --commit`. Still parsed for backward compatibility with older files and ignored by `nicely publish`, but no longer written — new entries omit it. |
| `level` | `major` / `minor` / `patch`. Drives the version bump at publish time. |
| `commit message` | Imperative, user-facing, self-contained. Use it verbatim as your `git` commit subject; `nicely publish` also folds it into the release commit's narrative. |

Plain text was chosen over JSON because line-level merges rarely
conflict and the file is trivially scannable with `cat`/`grep`. The
parser accepts any case for the level (`Major`, `MAJOR`, etc.) and
collapses whitespace around the colon and around the `✓` marker.

---

## Writing a commit message

Each entry's text becomes a `git` commit subject (and feeds the publish
commit narrative), so write it the way you'd write a commit subject:

- **Imperative mood.** "Add useBreakpoint hook", not "Adds" or "Added".
- **User-facing.** Describe what changed from the consumer's perspective,
  not the diff. "Drive slide animation duration from core tokens" beats
  "Update Slider.tsx".
- **Self-contained.** Each entry stands alone; readers shouldn't need
  the rest of the file (or the diff) to understand what it covers.
- **Scope, then summary.** Optional conventional-commit-style prefix is
  fine if you use it consistently in the package's git history (e.g.,
  `feat: Add useBreakpoint hook`), but not required.

Avoid release-notes paragraphs in this file. Long-form notes belong in
the README or a separate CHANGELOG.

---

## Writing entries

Two ways. Both are equivalent — pick whichever fits the moment.

### CLI

```bash
nicely bump major "Rename breakpoint identifiers"
nicely bump minor "Add useBreakpoint hook"
nicely bump patch "Re-export BREAKPOINT_* constants"
```

Run from the package root (or anywhere inside the package's tree — `nicely`
uses the current working directory to locate the file). Appends one line
to `.nice/bump.md`, creating the `.nice/` folder if missing.

### Direct edit

Open `.nice/bump.md` in the editor and append a line. Same format —
remember to include the `[YYYY-MM-DD HH:MM]` timestamp prefix so the
entry sorts and displays consistently with `nicely bump`-written entries.

### When to write an entry

Whenever a commit is publishable — meaning a consumer would observe or
need to be aware of the change. Not every commit warrants an entry:

| Commit | Entry? |
|--------|--------|
| New exported API, new prop, new hook | yes — `minor` |
| Renamed exported API, removed prop, changed default | yes — `major` |
| Bug fix in shipped behavior | yes — `patch` |
| Internal refactor with no consumer-visible effect | yes — `patch` (a rebuild is still required for dependents) |
| Docstring-only, test-only, CI-only changes | no |
| Edits to files outside `src/` (scripts, configs) | only if they change the published output |

Multiple entries in one file are additive — at publish time the highest
level wins (`major` beats `minor` beats `patch`).

---

## Committing your work

The toolkit no longer commits — use plain `git`. Record the intent, then
stage your change plus the updated `.nice/bump.md` and commit with the
entry's text as the subject:

```bash
nicely bump minor "Add useBreakpoint hook"   # append the entry
git add -u .nice/bump.md                     # stage change + bump file
git commit -m "Add useBreakpoint hook"       # entry text as the subject
```

- **One entry ↔ one commit** is the simplest mapping but not required —
  `.nice/bump.md` accumulates entries across commits and is only consumed
  at publish.
- **Strip the level prefix** (`major:`/`minor:`/`patch:`) from the git
  subject; it's bump intent for `publish`, not commit metadata.
- **Ad-hoc commits** (typo fixes, config tweaks) that don't warrant a bump
  entry are just a normal `git commit` with no `.nice/bump.md` change.
- **Multiple packages** — each `nice-*` package is its own repo; record an
  entry and commit in each, bottom-up per `read/inheritance.md`.

---

## Reading entries at publish time

`nicely publish` reads each affected package's `.nice/bump.md`,
**ignoring the `✓` marker** so every entry contributes to the
recommendation:

1. Parses each line into `{level, message}`
2. Computes the recommended bump level (`major` > `minor` > `patch`)
3. Displays the digest and prompts the user to accept or override

The Stage 1 prompt shows one row per changed package:

```
Recommended bumps (from .nice/bump.md):
  nice-styles              5.0.4 → 6.0.0   (major)   1 entry
  nice-react-styles        4.0.3 → 5.0.0   (major)   2 entries
  nice-react-flex          2.0.4 → 3.0.0   (major)   1 entry

[A]ccept all / [P]er-package / [V]iew entries / [C]ancel:
```

`[V]iew entries` prints every line from every `.nice/bump.md` grouped by
package so you can re-read the rationale before choosing.

---

## Publish commit message

When `publish` reaches its commit step, it concatenates the version
line with the bump file's contents (via `composeCommitMessage`):

```
3.0.0

Add useBreakpoint hook

- Re-export BREAKPOINT_* constants
- Fix typo in README
```

This way the publish commit captures both the version bump and the
narrative for that release in one place — the canonical record of "what
shipped in this version."

---

## Clearing entries

On a successful publish, `nicely publish` truncates `.nice/bump.md` to
empty for each published package. The now-empty file is included in the
version-bump commit that `nicely` writes automatically. The file is not
deleted — its continued presence signals that the feature is in use for
that package.

Clearing is exclusively a publish concern — ordinary `git` commits never
touch the entries. If a publish fails partway through, the entries stay
intact so the next `publish` run picks up where the last left off.

---

## AI Instance Convention

Claude instances working on `nice-*` packages MUST append a `.nice/bump.md`
entry in the same change as the work it describes, any time the change
is publishable per the "When to write an entry" table above. If the
change is purely non-publishable (docs, tests, CI), no entry is needed.

The entry's message should paraphrase the change in user-facing terms,
not describe the git commit. Write for a future consumer reading
release notes, not for another developer reading a diff. Same standard
applies whether the entry is written during the work or appended later
via `nicely bump`.