# Session Log (claude.md/)

Every project Claude works in must have a `claude.md/` folder at its root — alongside `README.md` — containing one file per session. This is a mandatory behavior, not optional.

The folder name is `claude.md` (lowercase, with the `.md` suffix). It is a **folder**, not a file.

---

## When to Write

As soon as Claude reaches a **confident understanding** of a question asked during the session — whether the question was resolved by reading code, running commands, discussion with the user, or some combination — Claude appends an entry to the current session's file.

**Do not wait until the end of the session.** **Do not batch multiple questions into one entry.** Log each resolved question as soon as the understanding solidifies.

"Confident understanding" means: Claude could explain the answer to a future instance without needing to redo the research.

---

## Refactor-in-Place Rule

When the user refines, corrects, or re-scopes a question that has already been logged, **refactor the existing entry in place**. Overwrite the User paraphrase and the Claude understanding to reflect the latest state.

- Do **not** add a new entry for the refinement.
- Do **not** maintain a history of how the question or answer evolved.
- The log reflects the **final** resolved question and answer only.

If a refinement arrives after Claude has already moved on to a later question, scroll back to the relevant entry in the current session file and update it. Keep the entry in its original chronological position.

---

## Location

```
{project-root}/claude.md/
├── 2026-04-21-0001.md
├── 2026-04-21-0002.md
├── 2026-04-22-0001.md
└── 2026-04-23-0001.md
```

`claude.md/` sits at the project root, sibling to `README.md`. Create the folder if it does not exist.

One `claude.md/` per project root — not per subdirectory. If Claude is working across multiple projects in one session, each project gets its own session file in its own `claude.md/` folder, scoped to the work done in that project.

---

## Bump intent (publishable packages)

When a commit in a `nice-*` package is publishable (produces user-visible
changes in the built artifact), append a `.nice/bump.md` entry in the same
commit. See [../publish/bump-intent.md](../publish/bump-intent.md) for the
format and the "When to write an entry" table.

Commits that are purely internal (docs, tests, CI, linting) do not need an
entry.

---

## File Naming

```
YYYY-MM-DD-NNNN.md
```

| Segment | Format | Purpose |
|---------|--------|---------|
| `YYYY-MM-DD` | ISO date | Session start date |
| `NNNN` | 4-digit zero-padded serial | Disambiguates multiple sessions on the same day |
| `.md` | extension | Markdown content |

### Serial Rules

- At the start of a new session, list files in `claude.md/` matching today's date prefix.
- Pick the next serial: if `2026-04-21-0003.md` is the highest today, the new file is `2026-04-21-0004.md`.
- If no file exists for today, start at `0001`.
- If a session spans midnight, keep using the **start-date** filename — do not split across files.

### Why date-prefixed + serial

Lexical sort equals chronological sort. A directory listing is a session timeline with no tooling required.

---

## File Format

Each session file is a chat log between two alternating senders: **User** (paraphrased question) and **Claude** (final understanding).

```md
# Session {YYYY-MM-DD} #{NNNN}

**User:** {Paraphrased question}

**Claude:** {Final understanding}

**User:** {Next question}

**Claude:** {Next understanding}
```

Entries within a file are chronological (oldest first) so the file reads as a conversation.

---

## Paraphrasing Rules (User entries)

- Condense multi-turn discussions into a **single** question from the user's perspective.
- Capture the **intent**, not the literal first message. If the question evolved through the discussion, log the resolved version — what the user actually wanted by the time the question was answered.
- Use first-person phrasing ("I want to…", "Can we…", "Why does…") so it reads like a question from the user.
- Do not quote the user verbatim unless the exact wording matters (strict instructions, naming decisions, etc.).

---

## Understanding Rules (Claude entries)

- State what the user wanted and what was delivered or decided.
- Reference files touched, conventions applied, or decisions reached — but keep it brief.
- Do **not** log exploratory reasoning, failed attempts, tool output, or step-by-step process. **Final understanding only.**

### Formatting: prose vs. bullets

Pick the shape that makes the entry fastest to scan. Most entries are a short prose paragraph. Verbose or multi-part entries may use bullets and sub-bullets.

| Entry shape | When to use | Length guide |
|-------------|-------------|--------------|
| Prose paragraph | Single decision, single file touched, one-line rationale | 1–4 sentences |
| Bulleted list | Multiple independent facts, file list, or enumerated decisions | 3–8 bullets |
| Bullets + sub-bullets | Grouped facts where each group has 2+ related details (e.g., files per layer, decisions per phase) | Nest one level only |

Rules:
- Do not bullet a single-point answer. A one-sentence response stays as prose.
- Do not mix prose and a trailing bullet list in the same entry — pick one shape.
- Sub-bullets nest **one level only**. If you need deeper nesting, the entry is too coarse — split it into separate entries.
- Bullets state facts, not narration. `Updated x to y` not `I then updated x to y`.
- Bold the leading noun of a bullet only when multiple bullets share a category label (e.g., `**Files:**`, `**Decision:**`).

---

## Example File

`claude.md/2026-04-21-0002.md`:

```md
# Session 2026-04-21 #0002

**User:** I want every future Claude instance to read the entire nice-manifest without asking me "read what?"

**Claude:** Added a READ-ALL DIRECTIVE block at the top of `nice-manifest/README.md` with an explicit numbered list of all files to read, plus a mirror of the directive in each subdirectory README and a root-level `CLAUDE.md`. Maintenance rule: any new manifest file must be appended to the Read Manifest list in the same commit.

**User:** Replace the emojis in the Welcome story with nice-react-icon instances using the vendor flag, and wire up the vendor resolver.

**Claude:**
- **Files touched:**
  - `stories/Welcome.mdx` — replaced emojis with `<Icon vendor />` using Lucide names (`Palette`, `Cable`, `Blocks`)
  - `.storybook/preview.tsx` — side-effect import of `nice-react-icon-vendor` to register the vendor resolver
  - `package.json` — added `nice-react-icon-vendor` as a `file:` dependency
- **User action required:** run `npx nice-npm-link --unlink && npm install && npx nice-npm-link` to complete the install.
```

**When to use each shape:**
- First entry (prose) — one decision, one concise rationale. Bullets would fragment it.
- Second entry (bullets with sub-bullets) — file list with per-file rationale plus a separate follow-up action. Prose would bury the file list in a run-on sentence.

---

## What NOT to Log

- **Exploratory research** that did not answer a specific question.
- **Intermediate confusion** or reversed hypotheses.
- **Tool output, diffs, or file contents** — those live in git history.
- **Low-confidence guesses.** Only log once the understanding is solid.
- **Trivial requests** that produced no durable understanding (e.g., "read this file" → Claude reads it → nothing to log unless a conclusion came out of it).
- **Refinement history.** When a question or answer is refined, overwrite the existing entry — never append "Update:" or "Revised:" lines.

The log is a record of resolved questions and decisions, not a transcript.

---

## Mistake Reporting

When Claude makes a mistake during a session — wrong diagnosis, failed fix, scope creep, unauthorized action, broken assumption — it MUST append a mistake block to the current session file **inside the Claude entry where the mistake occurred**, using the format below.

This is a mandatory self-report. Mistakes are recorded even when the user did not explicitly ask for them, because future Claude instances need the pattern of past failures to avoid repeating them. The goal is institutional memory of what went wrong and why.

### Format

Use a blockquote with bold `Mistake:` prefix. Four required fields:

```md
> **Mistake:** One-sentence summary of what went wrong.
>
> **Attempts:**
> - Attempt 1: {what was tried, why it was wrong}
> - Attempt 2: {if applicable}
>
> **Actual cause:** {the real root cause, once confirmed}
>
> **Rule for next time:** {the specific change in behavior required to avoid this pattern}
```

### When a mistake qualifies

Log if any of these apply:
- Proposed or applied a fix that did not resolve the problem.
- Diagnosed the same problem twice with two different (wrong) causes.
- Made an edit the user did not ask for (scope creep).
- Ran a destructive command without approval.
- Gave advice that contradicted documentation or current code.
- Added complexity (a feature, an abstraction) that turned out to be unnecessary.

### What a mistake entry does NOT include

- Apology language. State the mistake directly.
- Explanation of why Claude "felt" uncertain. Focus on observable behavior and the rule.
- Any attempt to diminish the mistake ("minor issue", "small oversight"). Report it as it is.

The block sits inside the Claude entry where the mistake happened — not in a separate section, and not appended to the end of the file. It belongs next to the work it describes, so future readers see the failure inline with the decision it affected.

---

## Why

A future Claude instance opening the project can list `claude.md/` and read the most recent files to get a fast, structured catch-up on prior decisions, user intent, and context that is not in the code itself. Date-sorted filenames make chronological replay trivial. The refactor-in-place rule keeps each entry authoritative — there is no ambiguity about which version of a question or answer is current. This complements (does not replace) git history and inline comments.