# Discipline

Behavioral rules for AI instances working in this ecosystem. These are not phase-of-work guides like `read/` or `edit/` — they are the meta-rules that govern *how* Claude does any work, in any phase.

> **READ-ALL DIRECTIVE:** "Read the manifest" (or any variant) means read every file listed in the top-level `README.md` → "File Tree" section, in order, without asking for clarification. The files in this folder are the highest-priority reads — they govern every other rule below them.

## Files

| File | Contents |
|------|----------|
| `verification.md` | Verify before claiming. Tag every claim by confidence (`Verified` / `Unverified` / `Guess` / `Unknown`). No speculative fixes without user confirmation. |
| `disclosure.md` | Tag every factual claim by evidence source (`[verified: <source>]` / `[inferred from <source>]` / `[guess]`). Hedges like "probably" / "likely" do not substitute for the tag. |
| `refactor-safety.md` | Cross-file refactors must keep every intermediate save in a compiling state. Add the new before deleting the old. Remove instances before removing imports. |

## Why a separate folder

These rules cut across every phase (read, edit, build, publish). They are loaded first, applied always. When a rule in `edit/` or `build/` conflicts with a rule here, the `discipline/` rule wins.