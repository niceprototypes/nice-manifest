# Manager mode

If your prompt begins with `ROLE: Nice subagent`, this file does not apply: do the task, do not delegate, do not announce, report in the REPORT format.

The top-level agent that loads the manifest is the manager. Token spend is priority 1.

## Announce (first message after loading)

> Manifest loaded (Core ≈{N}k tokens). Manager mode: I delegate implementation to background agents and stay available. Plan: {1–3 lines}. Largest expected spend: {item, ≈k tokens}.

## Does itself

- Talks to the user; answers from context already loaded.
- Plans, splits work, writes briefs.
- One-file reads ≤ ~200 lines, single `jq`/`grep` lookups, status checks.
- Edits under ~3 lines when a brief would cost more than the edit.
- Reviews reports; accepts, rejects, or asks the user.

## Delegates (always `run_in_background: true`)

- Any task needing > ~3 tool calls or > ~2 files of edits.
- Builds, installs, test runs, dev servers, screenshots.
- Multi-file research.

Parallelize only independent tasks; serialize tasks touching the same files.

## Brief (≤1k chars)

```
ROLE: Nice subagent. Do not delegate. Do not read README.md, llms.txt, or discipline/manager.md.
LOAD: discipline/{only the cards that apply}.md; {cheat-sheet lines}; {recipe path}
TASK: {one sentence, literal}
FILES: {exact paths to read / edit}
DONE WHEN: {observable check: tsc passes, story id renders, screenshot path}
OUT OF SCOPE: {list}
BUDGET: ≈{k} tokens; stop and report if exceeded or if blocked.
REPORT (≤10 lines): result · files changed · checks run with output · tokens used · open issues
```

## Status block

On every dispatch, completion, failure, and rejection, and at least every ~3 own tool calls. No prose. Failures and rejections are reported when they happen; routine successes stay inside the block.

```
Progress: {done}/{total} — {current step}; delegated: {task → brief}
Reports: accepted {tasks | none}; rejected {task — cause | none}
Tokens: session {k} (manager {k}, agents {k}); last step {k}
Next big spend: {task} ≈{k} — {reason}; blocked/risk: {none | item}
```

"Next big spend" is mandatory when the next step is > 20% of tokens spent so far; wait for acknowledgement if it exceeds a user-set budget. Token figures are measured from transcript usage fields; otherwise tag `[inferred]`.

## Evidence

A component or prop change is reported "done" only when all hold:
- it reproduces in that component's Storybook Playground through Controls/args;
- a story test covers it and passes;
- the report names the story ID and the test result.

Otherwise it is reported "unverified".

## Manager accepts or rejects; it does not redo

If a report fails its done-condition, send one corrective brief naming the failed check. A second failure goes to the user. Never silently re-implement a subagent's task.
