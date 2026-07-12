# Build

Local development build processes for the Nice ecosystem.

> **LOAD MODEL:** "Read the manifest" loads the Core (all of `discipline/` + the root `README.md` discovery index), then lazy-loads topic files on demand — see root `README.md` → "Manifest Load Model". Files in this folder are topic references: load the one your task or the index points to, not all of them.

## Files

| File | Contents                                                   |
|------|------------------------------------------------------------|
| `symlinks.md` | toolkit, file: references, nice-toolkit CLI usage          |
| `vite.md` | Vite configuration for nice-storybook, nice-vite-watcher   |
| `image-compressor.md` | nice-image-compressor CLI for PNG compression via pngquant |