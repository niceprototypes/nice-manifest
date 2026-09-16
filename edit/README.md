# Edit

Standards for creating new assets in the Nice ecosystem.

> **LOAD MODEL:** "Read the manifest" loads the Core (all of `discipline/` + the root `README.md` discovery index), then lazy-loads topic files on demand — see root `README.md` → "Manifest Load Model". Files in this folder are topic references: load the one your task or the index points to, not all of them.

## Files

| File | Contents |
|------|----------|
| `component.md` | Component package structure, types, tokens |
| build config → [`topics/build-config.md`](../topics/build-config.md) | Config packages, standards (rollup/tsconfig/jest), deviation audit — **moved** to its single-home topic |
| `comments.md` | Inline code comment standards for AI readability |
| `generators.md` | Generators & emitters: pipeline shape, structure rules, documentation standard, `node:test` snapshot tests |
| `session-log.md` | **Deprecated.** Session logs are now handled by per-package `.nice/bump.md` files; this file records what moved and keeps the mistake-reporting format. See [`publish/bump-intent.md`](../publish/bump-intent.md). |
| `storybook.md` | Story file patterns for nice-storybook |
