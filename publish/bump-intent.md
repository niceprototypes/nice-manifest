# Bump Intent

Each publishable Nice ecosystem package records pending semver intent in
`.nice/bump.md` at the package root. Each entry's text is a **commit
message** — `ntk --commit` consumes pending entries to drive `git
commit`, then `ntk --publish` reads every entry (consumed or not) to
recommend a bump level and clears the file on a successful publish.

This removes guesswork at commit and publish time — the information
lives next to the code that changed, and neither the person committing
nor the person publishing has to reconstruct what warranted the change.

---

## Format

Plain text. One entry per line. Bracketed timestamp, optional `✓`
consumed marker, level, colon, commit message:

```
[2026-04-25 21:50] major: Rename breakpoint identifiers mobile/tablet/desktop to small/medium/large
[2026-04-25 21:51] minor: Add useBreakpoint hook
[2026-04-25 21:52] ✓ patch: Re-export BREAKPOINT_* constants
```

| Field | Meaning |
|-------|---------|
| `[YYYY-MM-DD HH:MM]` | Timestamp, in local time. Written automatically by `ntk --bump`. Direct edits should match the format. |
| `✓` (optional) | Consumed marker — present when `ntk --commit` has already used this entry's text in a commit. `ntk --publish` ignores the marker and clears the file regardless. |
| `level` | `major` / `minor` / `patch`. Drives the version bump at publish time. |
| `commit message` | Imperative, user-facing, self-contained. `ntk --commit` uses this verbatim as the commit subject (single entry) or as the subject + bullet body (multiple entries). |

Plain text was chosen over JSON because line-level merges rarely
conflict and the file is trivially scannable with `cat`/`grep`. The
parser accepts any case for the level (`Major`, `MAJOR`, etc.) and
collapses whitespace around the colon and around the `✓` marker.

---

## Writing a commit message

Each entry's text is consumed verbatim by `ntk --commit`, so write it
the way you'd write a git commit subject:

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
ntk --bump major "Rename breakpoint identifiers"
ntk --bump minor "Add useBreakpoint hook"
ntk --bump patch "Re-export BREAKPOINT_* constants"
```

Run from the package root (or anywhere inside the package's tree — `ntk`
uses the current working directory to locate the file). Appends one line
to `.nice/bump.md`, creating the `.nice/` folder if missing.

### Direct edit

Open `.nice/bump.md` in the editor and append a line. Same format —
remember to include the `[YYYY-MM-DD HH:MM]` timestamp prefix so the
entry sorts and displays consistently with `ntk --bump`-written entries.

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

## Committing entries

`ntk --commit` reads pending (non-`✓`) entries from each affected
package's `.nice/bump.md`, derives a git commit message from them, and
commits.

```bash
# All packages with pending entries (with confirmation prompt)
ntk --commit

# Specific packages — same shape as --publish, no dependency cascade
ntk --commit nice-react-tile,nice-styles

# Override the message (skips bump.md, no ✓-marking)
ntk --commit nice-react-tile -m "Fix typo in README"

# Also stage untracked non-ignored files
ntk --commit --all

# Preview without committing
ntk --commit --dry-run
```

### Resolution priority

1. Explicit package list — `ntk --commit nice-react-tile,nice-styles`
2. cwd-detection — running from inside a registered package's tree
3. Auto-scan — every registered package with pending bump entries

The candidates are displayed in the same tier-grouped table used by
`--publish`, then a confirmation prompt asks before any commit happens.

### Commit message composition

| Pending entries | Commit message |
|-----------------|----------------|
| 1 | the entry's message verbatim |
| N | first entry's message as subject, remaining entries as bulleted body |

The level prefix (`major:`/`minor:`/`patch:`) is stripped — that's bump
intent for `--publish`, not commit metadata.

### Staging rules

- `git add -u` — modifications and deletions to all tracked files
- Always stages `.nice/bump.md` (whether modified or untracked the first time)
- With `--all`: also `git add -A` for untracked non-ignored files
- Without `--all`: surfaces untracked files as a warning, doesn't block

The `✓` consumed marker is written into `bump.md` *before* staging so
the marker change rides along in the same commit, leaving a clean
working tree on success.

### Override message (`-m` / `--message`)

When `-m` is supplied, `--commit` skips the bump.md read entirely and
uses the override as the commit message. Pending entries are not
consumed and not marked ✓ — useful for ad-hoc commits (typo fixes,
config tweaks) that aren't worth a bump entry.

---

## Reading entries at publish time

`ntk --publish` reads each affected package's `.nice/bump.md`,
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

When `--publish` reaches its commit step, it concatenates the version
line with the bump file's contents (via `composeCommitMessage`):

```
3.0.0

Add useBreakpoint hook

- Re-export BREAKPOINT_* constants
- Fix typo in README
```

This way the publish commit captures both the version bump and the
narrative for that release in one place. If the entries were already
consumed by `ntk --commit` earlier, they appear here too — the publish
commit is the canonical record of "what shipped in this version."

---

## Clearing entries

On a successful publish, `ntk --publish` truncates `.nice/bump.md` to
empty for each published package. The now-empty file is included in the
version-bump commit that `ntk` writes automatically. The file is not
deleted — its continued presence signals that the feature is in use for
that package.

`ntk --commit` does **not** clear entries — it marks them `✓`. Clearing
is exclusively a publish concern.

If a publish fails partway through, the entries stay intact (still
`✓`-marked from any prior `--commit`) so the next `--publish` run picks
up where the last left off.

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
via `ntk --bump`.