# Git

## Commit Format

Each line in `.nice/bump.md` is a commit message. `ntk --commit` uses
those entries verbatim:

```
ntk --commit                          # all packages with pending entries
ntk --commit nice-react-tile          # one package
ntk --commit nice-react-tile -m "..." # override message (skips bump.md)
```

Single pending entry → its text is the commit subject. Multiple pending
entries → first entry as subject, remaining entries as bulleted body.
The level prefix (`major:`/`minor:`/`patch:`) is stripped from the
commit message — it's bump intent for `--publish`, not commit metadata.

For ad-hoc commits that don't warrant a bump entry (typo fixes, config
tweaks), use `-m`:

```
ntk --commit nice-react-tile -m "fix typo in README"
```

See [`bump-intent.md`](./bump-intent.md) for the full bump-entry format,
the `✓` consumed marker, and the relationship between `--commit` and
`--publish`.

## Multi-Package Changes

Make changes bottom-up per `read/inheritance.md` dependency order. When
several packages have pending entries at once, `ntk --commit` (no args)
shows the candidate table grouped by tier and asks for confirmation
before committing each.

## Before Committing

```bash
ntk --clean-all
npm run build
npm test
```