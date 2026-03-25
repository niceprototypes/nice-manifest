# nice-image-compressor

CLI PNG compression tool using pngquant. Currently lives at `nice-website-2025/scripts/nice-image-compressor/` but is project-agnostic — works on any directory of PNG files.

## Prerequisites

```bash
brew install pngquant
```

## Commands

| Command | Description |
|---------|-------------|
| `nice-image-compressor <path> --dry-run` | Inventory table: file name, path, size, compression status |
| `nice-image-compressor <path>` | Compress all uncompressed PNGs in place |

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `--quality <min-max>` | `65-80` | pngquant quality range |
| `--speed <1-11>` | `4` | Compression speed (1 = slowest/best, 11 = fastest) |
| `--strip` | on | Remove PNG metadata |
| `--no-strip` | — | Keep PNG metadata |
| `--skip-if-larger` | on | Skip if compressed output exceeds original size |
| `--dry-run` | — | Report table without compressing |

## Examples

```bash
# Inventory all PNGs in public/rasters
nice-image-compressor public/rasters --dry-run

# Compress all PNGs with defaults (quality 65-80, speed 4)
nice-image-compressor public/rasters

# High-quality compression (slower)
nice-image-compressor public/rasters --quality 80-95 --speed 1
```

## Architecture

```
scripts/nice-image-compressor/
├── nice-image-compressor    # CLI entry (shebang)
└── src/
    ├── index.js             # Orchestrator: scan → analyze → compress/report
    ├── args.js              # Argument parsing, usage display
    ├── scanner.js           # Recursive PNG file discovery
    ├── analyzer.js          # IHDR chunk reading, size analysis, indexed detection
    ├── compressor.js        # pngquant shell-out, exit code handling
    ├── logger.js            # ANSI color formatting, log levels
    └── png-compressor.md    # Competitive analysis and feature roadmap
```

## How Compression Detection Works

Reads the PNG IHDR chunk (byte 25 = color type). Color type 3 = indexed-color (palette-based), which is what pngquant produces. Files already indexed are skipped.

## Dry-Run Output

Table with columns: File, Path, Size, Compressed (Yes/No). Includes summary of total size and count of already-compressed files.

## Compress Output

Per-file status line: compressed (with before/after sizes and % saved), skipped (already indexed or output not smaller), or error. Summary at end with counts.

## pngquant Exit Codes

| Code | Meaning | Behavior |
|------|---------|----------|
| 0 | Success | File compressed in place |
| 98 | Output larger than input | Skipped (--skip-if-larger) |
| 99 | Quality too low for range | Skipped |