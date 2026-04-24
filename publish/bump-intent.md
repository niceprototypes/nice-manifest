# Bump Intent

Each publishable Nice ecosystem package records pending semver intent in
`.nice/bump.md` at the package root. Writers append entries as changes are
made; `nnl --publish` reads the file to recommend a bump level and then
clears it on successful publish.

This removes the guesswork at publish time — the information lives next to
the code that changed, and the person publishing never has to reconstruct
what warranted a major vs. minor vs. patch.

---

## Format

Plain text. One entry per line. Level, colon, short summary:

```
major: Rename breakpoint identifiers mobile/tablet/desktop to small/medium/large
minor: Add useBreakpoint hook
patch: Re-export BREAKPOINT_* constants
```

Plain text was chosen over JSON because line-level merges rarely conflict and
the file is trivially scannable with `cat`/`grep`. The parser accepts any
case for the level (`Major`, `MAJOR`, etc.) and collapses whitespace around
the colon.

---

## Writing entries

Two ways. Both are equivalent — pick whichever fits the moment.

### CLI

```bash
nnl --bump major "Rename breakpoint identifiers"
nnl --bump minor "Add useBreakpoint hook"
nnl --bump patch "Re-export BREAKPOINT_* constants"
```

Run from the package root (or anywhere inside the package's tree — `nnl`
uses the current working directory to locate the file). Appends one line to
`.nice/bump.md`, creating the `.nice/` folder if missing.

### Direct edit

Open `.nice/bump.md` in the editor and append a line. Same format.

### When to write an entry

Whenever a commit is publishable — meaning a consumer would observe or need
to be aware of the change. Not every commit warrants an entry:

| Commit | Entry? |
|--------|--------|
| New exported API, new prop, new hook | yes — `minor` |
| Renamed exported API, removed prop, changed default | yes — `major` |
| Bug fix in shipped behavior | yes — `patch` |
| Internal refactor with no consumer-visible effect | yes — `patch` (a rebuild is still required for dependents) |
| Docstring-only, test-only, CI-only changes | no |
| Edits to files outside `src/` (scripts, configs) | only if they change the published output |

Multiple entries in one file are additive — the highest level wins at
publish time (`major` beats `minor` beats `patch`).

---

## Reading entries

At publish time, `nnl --publish` reads each affected package's
`.nice/bump.md`:

1. Parses each line into `{level, summary}`
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

## Clearing entries

On successful publish (not on failure), `nnl --publish` truncates the file
to empty for each published package. The now-empty file is included in the
version-bump commit that `nnl` writes automatically. The file is not
deleted — its continued presence signals that the feature is in use for
that package.

If a publish fails partway through, the entries stay intact so the next
`--publish` run picks up where the last left off.

---

## AI Instance Convention

Claude instances working on `nice-*` packages MUST append a `.nice/bump.md`
entry in the same commit as the change it describes, any time the commit is
publishable per the "When to write an entry" table above. If the commit is
purely non-publishable (docs, tests, CI), no entry is needed.

The entry's summary should paraphrase the change in user-facing terms, not
describe the git commit. Write for a future consumer reading release notes,
not for another developer reading a diff.