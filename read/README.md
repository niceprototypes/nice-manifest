# Read

Understanding the Nice ecosystem's existing structure.

> **LOAD MODEL:** "Read the manifest" loads the Core (all of `discipline/` + the root `README.md` discovery index), then lazy-loads topic files on demand — see root `README.md` → "Manifest Load Model". Files in this folder are topic references: load the one your task or the index points to, not all of them.

## Files

| File | Contents |
|------|----------|
| `inheritance.md` | Package hierarchy, dependency graph, layered system design |
| `audit.md` | The audits — architecture (manifest ↔ architecture ↔ stories) and full (architecture + all consumers), built from the manifest / storybook / consumer audits — their trigger phrases and scope, plus known manifest gaps |
| `projects/storybook.md` | nice-storybook structure and scripts |
| `projects/website.md` | nice-website-2025 structure and scripts |
| `styles/tokens.md` | Token naming conventions, getToken usage |