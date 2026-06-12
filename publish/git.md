# Git

Committing is plain `git`. The toolkit records bump intent (`ntk --bump`) and
runs its own commit during `ntk --publish`, but it does **not** wrap an
everyday `git commit` — the old `ntk --commit` was removed.

## Workflow

1. Record the change's semver intent (when publishable — see
   [`bump-intent.md`](./bump-intent.md) → "When to write an entry"):

   ```bash
   ntk --bump minor "Add useBreakpoint hook"
   ```

   This appends one timestamped line to the package's `.nice/bump.md` and
   reminds you to commit that file alongside your change. (Direct-editing
   `.nice/bump.md` is equivalent.)

2. Commit with `git`, staging your change **and** `.nice/bump.md`:

   ```bash
   git add -u .nice/bump.md
   git commit -m "Add useBreakpoint hook"
   ```

   Use the bump entry's text as the commit subject. The level prefix
   (`major:`/`minor:`/`patch:`) is bump intent for `--publish`, not commit
   metadata — leave it out of the git message.

Ad-hoc commits that don't warrant a bump entry (typo fixes, config tweaks)
are just a normal `git commit` with no `.nice/bump.md` change.

## Multi-Package Changes

Make changes bottom-up per `read/inheritance.md` dependency order. Each
`nice-*` package is its own git repo — record a `.nice/bump.md` entry and
commit in each affected package separately.

## Before Committing

```bash
ntk --dedupe
npm run build
npm test
```

## Publishing

`ntk --publish` makes its own commit as part of the release: it reads each
affected package's `.nice/bump.md`, computes the version bump, builds,
publishes, truncates the bump file, and commits the version changes (commit
message = the new version + the entries' narrative). See
[`bump-intent.md`](./bump-intent.md) and [`npm.md`](./npm.md).
