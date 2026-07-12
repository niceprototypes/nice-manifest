# Discipline

Behavioral rules for AI instances working in this ecosystem. These are not phase-of-work guides like `read/` or `edit/` — they are the meta-rules that govern *how* Claude does any work, in any phase.

> **LOAD MODEL:** The files in this folder are the always-on **Core** — loaded on every "read the manifest" and applied to all work, always. Topic references in `read/`/`edit/`/`build/`/`publish/` are lazy-loaded on demand; see root `README.md` → "Manifest Load Model".

## Files

| File | Contents |
|------|----------|
| `responsiveness.md` | Never go unresponsive. No foreground subagents (`run_in_background: true` always); don't delegate small/mechanical work; emit progress every ~3 tool calls; match effort to task size. |
| `grounding.md` | Never present a guess as fact. Verify before claiming; tag every factual claim `[verified]`/`[inferred]`/`[guess]`; never invent a typed/enumerated value (read the registry); no scope creep. Merges the former verification + disclosure + typed-values rules. |
| `refactor-safety.md` | Every save must compile — both directions. **Adding:** define the referent (prop, export, token, file) fully before any consumer references it. **Removing:** delete every reference before the import/definition. State the edit order before the first edit. The manifest's most-violated rule. |
| `offboarding.md` | Before finishing a unit of work, reconcile every new discrepancy your change opened between the manifest and the project. The per-change, self-reviewed subset of the manifest audit. |
| `scope.md` | Do exactly what was asked. No unrequested rewrites, abstractions, extra components, or adjacent "improvements". An incidental mention is context, not a request. |
| `communication.md` | No sycophancy, fake-human tone, lecturing, or unsolicited caveats/next-steps. Announce long or hanging ops. Match answer length to the question. |
| `stale-first.md` | Before investigating "broken" code, rule out stale state (browser tab, dev server, un-rebuilt package) — especially right after your own rename. The biggest token sink. |

## Why a separate folder

These rules cut across every phase (read, edit, build, publish). They are loaded first, applied always. When a rule in `edit/` or `build/` conflicts with a rule here, the `discipline/` rule wins.