# Offboarding

**Highest-priority closing rule for AI instances.** Run before declaring any
unit of work done.

The manifest is only useful while it matches the code. Every change risks
opening a gap between what the manifest says and what the project *is*.
Offboarding is the checkpoint that catches that gap at the moment it is created —
by the instance with the most context (the one that just made the change), not a
future instance debugging a stale doc.

---

## The rule

Before finishing a unit of work, review your own changes against the manifest
and reconcile every **new** discrepancy. A discrepancy is any place the manifest
now misstates, omits, or contradicts the project after your change.

This is scoped to the discrepancies *your change* introduced — not a full audit
of the whole manifest. Pre-existing drift you happen to notice is reported, not
necessarily fixed (see *How to reconcile*).

---

## When it runs

At the end of any unit of work that changed something the manifest observes:

- A new package, or a removed/renamed one.
- A new / renamed / removed export, prop, token, service, or convention.
- A moved or renamed file/folder a manifest file cites by path.
- A build / config / version change in scope of the Alignment Principle.

Skip it for purely internal edits with no manifest-observable effect (a bug fix
that changes no documented behavior, a comment, a test).

---

## What to check — change → manifest location

| Change you made | Manifest to reconcile |
|-----------------|----------------------|
| New / removed package | `read/inheritance.md` (layer, dependency graph, categories), `publish/npm.md` (publish order, peer-dep table), `read/audit.md` (status table), and `nice-toolkit/registry.json` |
| New / renamed / removed export, prop, token, service | the package's section in `read/`, plus `edit/component.md` and `read/styles/tokens.md` as applicable |
| New convention or pattern | the relevant `edit/` / `build/` / `publish/` file |
| Moved / renamed file or folder | every manifest path that cites it |
| Version / build / config change | `README.md` → Alignment Principle table, `topics/build-config.md` |

---

## How to reconcile

- **Manifest is wrong or stale → fix the manifest, now, in the same unit of
  work.** Code is the source of truth (`read/audit.md`).
- **Code violates a deliberate documented pattern → flag it** to the user; do
  **not** silently rewrite the doc to bless a regression.
- **Pre-existing discrepancy you did not create → report it.** Fix only if it is
  cheap and adjacent to your change; otherwise leave it for an explicit audit so
  the scope of your change stays legible.

---

## Relation to the audits

Offboarding is the per-change, self-reviewed subset of the **manifest audit**
(`read/audit.md`). The audit is the full, on-demand sweep of the entire manifest
against the entire codebase; offboarding is the narrow "did *my* change open a
gap" check that every instance owns at the end of its own work. A clean
offboarding on every change keeps the audits short.

---

## Self-check before declaring done

1. Did I add, rename, or remove anything a manifest file names or lists?
2. If yes, did I update every place that names it?
3. Did I introduce a pattern or convention the manifest should teach?
4. Are the discrepancies I can't (or shouldn't) fix reported to the user, not
   silently left behind?

If any answer is unsatisfied, reconcile or report before finishing.
