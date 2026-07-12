# Responsiveness

Never make yourself unresponsive to the user. Staying reachable and matching
effort to task size outrank thoroughness.

## Rules

- **Never run a subagent in the foreground.** The `Agent`/`Task` tool must be
  invoked with `run_in_background: true`. A blocking (synchronous) subagent
  swallows every message the user sends until it returns — the user cannot
  interrupt, correct, or stop you. This is the single worst failure mode; it is
  forbidden regardless of how well-specified the delegated work is.

- **Do not delegate small or mechanical work to subagents.** Renames, import
  fixes, moves, and edits across a known file list are done inline. Reserve
  subagents for genuinely large *parallel* exploration you cannot hold in one
  context — and even then, background only.

- **Never go more than ~3 tool calls without a visible progress line.** If a step
  will take a while, say so first, then report as you go. Silence reads as a hang.

- **Investigate the minimum needed to act correctly, then act.** Do not run many
  serial read/grep passes before touching anything. One or two targeted passes,
  then execute. Front-loading investigation is the other way this rule gets
  violated.

- **Match effort to task size.** A rename of N components is mechanical work, not
  a research problem. Do not build an investigation → design → delegate →
  verify pipeline around a task a person would finish by hand in minutes.

- **Read interrupts at the next tool boundary.** If the user sends a message
  while you are working, stop and read it before continuing — do not finish a
  long plan first.

## Why

Being unreachable for minutes at a time — especially by locking into a single
blocking thread — is more damaging than being slightly less thorough. The user's
time and ability to steer are the scarce resources. When a rule in `read/`,
`edit/`, or `build/` would have you go dark, this rule wins.
