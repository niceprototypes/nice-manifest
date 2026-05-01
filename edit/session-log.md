# Session Log (manifest/.nice/sessions/)

All Claude session logs across the entire local Nice ecosystem live in a **single, centralized folder** at `manifest/.nice/sessions/`. One file per date — every package's resolved entries for that day go in the same date file. This is mandatory.

The local Nice ecosystem at `~/nice/*` is a single AI-and-development-optimized workspace, not a multi-repo monorepo. Per-package session logs were consolidated here so a future Claude instance reads one folder to replay every project's history in chronological order.

> **History (do not recreate the older layouts):**
> 1. Session logs were originally written to a top-level `claude.md/` folder per project.
> 2. That folder moved under `.nice/sessions/` per project so all AI-instance metadata sat under `.nice/`.
> 3. With the `~/nice/*` consolidation (April 2026), all per-package `.nice/sessions/` were merged into the single `manifest/.nice/sessions/` location. Each entry's source package is preserved inline in the timestamp marker (`**Claude (HH:MM, {package}):**`), not by filename or folder.
>
> Older session files left at the previous locations are migration artifacts only — do not append to them.

---

## When to Write

As soon as Claude reaches a **confident understanding** of a question asked during the session — whether the question was resolved by reading code, running commands, discussion with the user, or some combination — Claude appends an entry to the current date's file in `manifest/.nice/sessions/`.

**Do not wait until the end of the session.** **Do not batch multiple questions into one entry.** Log each resolved question as soon as the understanding solidifies.

"Confident understanding" means: Claude could explain the answer to a future instance without needing to redo the research.

Capture the timestamp at the moment of write — local time, `HH:MM`. The timestamp goes inside the `**Claude:**` marker (see File Format below) along with the source package, and is what gives a single-day session its within-day chronology.

---

## Refactor-in-Place Rule

When the user refines, corrects, or re-scopes a question that has already been logged, **refactor the existing entry in place**. Overwrite the User paraphrase and the Claude understanding to reflect the latest state.

- Do **not** add a new entry for the refinement.
- Do **not** maintain a history of how the question or answer evolved.
- The log reflects the **final** resolved question and answer only.

If a refinement arrives after Claude has already moved on to a later question, scroll back to the relevant entry in the current date's file and update it. Keep the entry in its original chronological position.

---

## Location

```
~/nice/manifest/.nice/
├── bump.md                    # manifest's own bump intent (rare; manifest is not a published package)
└── sessions/                  # SINGLE centralized session log for every package
    ├── 2026-04-21.md
    ├── 2026-04-22.md
    └── 2026-04-23.md
```

There is exactly one `sessions/` folder in the entire local workspace — `manifest/.nice/sessions/`. Other packages must **not** create their own `.nice/sessions/` folder. If one is found, merge its contents into the central log and delete the per-package folder.

A package's own `.nice/` folder still exists for **bump intent only** (`bump.md`). Sessions do not live there.

---

## Bump intent (publishable packages)

When a commit in a `nice-*` package is publishable (produces user-visible changes in the built artifact), append a `.nice/bump.md` entry **in that package** in the same commit. See [../publish/bump-intent.md](../publish/bump-intent.md) for the format and the "When to write an entry" table. `bump.md` stays per-package because each `nice-*` package is independently versioned and published; sessions are workspace-wide because Claude's reasoning often spans multiple packages.

Commits that are purely internal (docs, tests, CI, linting) do not need an entry.

---

## File Naming

```
YYYY-MM-DD.md
```

| Segment | Format | Purpose |
|---------|--------|---------|
| `YYYY-MM-DD` | ISO date | Session date |
| `.md` | extension | Markdown content |

One file per day, workspace-wide. Every package's resolved entries for a given date go in that date's file — chronology within the file comes from the `HH:MM` stamp on each `**Claude:**` marker, and source-package context comes from the marker's package tag.

If a working block crosses midnight, append to the start-date file until the user next prompts after the date rolls over; from then on, append to the new date's file.

### Why date-prefixed

Lexical sort equals chronological sort. A directory listing is a daily timeline with no tooling required. With every package's entries in one date file, replaying a day's full Nice-ecosystem activity is a single `cat`.

---

## File Format

Each session file is a chat log between two alternating senders: **User** (paraphrased question) and **Claude** (final understanding, with source-package tag).

```md
# Session {YYYY-MM-DD}

**User:** {Paraphrased question}

**Claude ({HH:MM}, {package}):** {Final understanding}

**User:** {Next question}

**Claude ({HH:MM}, {package}):** {Next understanding}
```

`{package}` is the folder name under `~/nice/` where the work was performed (`storybook`, `react-button`, `styles`, `manifest`, etc.) — not the npm package name. If a single resolved entry spans multiple packages, tag it with the package the user invoked Claude from (the "primary" package); the entry body names the others.

The `HH:MM` stamp is local time at the moment Claude writes the entry. Multiple Claude turns in the same file will have ascending stamps; the gap between them is meaningful (a long gap implies a working pause or a complex tangent).

Entries within a file are chronological (oldest first), regardless of which package they originated in.

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

`manifest/.nice/sessions/2026-04-22.md`:

```md
# Session 2026-04-22

**User:** Add `backgroundSize` as a core token set — variants `contain` / `cover` / `fill` / `none` / `scale-down`.

**Claude (17:54, styles):** Added `backgroundSize` to `src/tokens/module.json`, ran `npm run build` to regenerate. After the build, `src/generated/tokensData.ts`, `src/generated/types.ts` (`BackgroundSizeType = "contain" | "cover" | "fill" | "none" | "scale-down"`), `dist/variables.css`, and `dist/css/backgroundSize.css` all emit the new variants.

**User:** Expose the new `BackgroundSizeType` from nice-styles so nice-react-image can consume it.

**Claude (17:57, react-styles):** Added `BackgroundSizeType` to the explicit `export type { … } from 'nice-styles'` list in `src/index.ts`.

**User:** Keep the Token Groups table in sync with the new `backgroundSize` core token set.

**Claude (17:58, manifest):** Added a `backgroundSize` row to `read/styles/tokens.md` between `backgroundColor` and `borderColor`.
```

The three entries above all live in the same file, in chronological order, with the source package preserved inline. A future Claude instance can replay the entire 2026-04-22 ecosystem activity by reading one file.

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

When Claude makes a mistake during a session — wrong diagnosis, failed fix, scope creep, unauthorized action, broken assumption — it MUST append a mistake block to the current date's file **inside the Claude entry where the mistake occurred**, using the format below.

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

## Why a single centralized folder

A future Claude instance opening any package in `~/nice/*` can list `manifest/.nice/sessions/` and read the most recent files to get a fast, structured catch-up on prior decisions, user intent, and cross-package context — even if the work spanned packages that are individually published. Date-sorted filenames make chronological replay trivial. The package tag inside each Claude marker preserves source context without fragmenting the log into per-package files. The refactor-in-place rule keeps each entry authoritative — there is no ambiguity about which version of a question or answer is current. This complements (does not replace) per-package git history and inline comments.
