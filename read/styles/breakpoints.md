# Breakpoints

Pixel thresholds for responsive `@media` queries. One source of truth feeds
both the runtime getters (`getBreakpoint`, `getBreakpointValue`) and the
build-time `@media` literals baked into `dist/tokens.css`.

---

## Defaults

| Name | Pixels | Query shape |
|------|-------:|-------------|
| `phone` | derived (`tablet − 1`) | `@media (max-width: 640px)` |
| `tablet` | `641` | `@media (min-width: 641px)` |
| `laptop` | `1280` | `@media (min-width: 1280px)` |
| `desktop` | `1720` | `@media (min-width: 1720px)` |

`phone` is the implicit mobile-first base — it has **no stored pixel entry** and
is not editable. Its ceiling is derived as `tablet − 1`, so moving the `tablet`
floor automatically shifts where the phone band ends. The three editable floors
are `tablet` / `laptop` / `desktop`; each is a `min-width` threshold you can set
independently.

---

## Customizing — build time

Edit `nice-styles/src/tokens/breakpoints.json` (the editable floors — no
`phone` key; phone is the derived base):

```json
{
  "tablet": 600,
  "laptop": 1100,
  "desktop": 1800
}
```

Rebuild nice-styles:

```bash
cd nice-styles && npm run build
```

The generator writes `src/generated/breakpointsData.ts`, which feeds the
runtime `BREAKPOINTS` const and the build-time `@media (min-width: …)`
literals in `dist/tokens.css`.

After rebuild: hard-reload the consumer so the new `tokens.css` is fetched.

---

## Customizing — runtime

Use `setBreakpoints` from `nice-styles` (or `nice-react-styles`). Same shape
as `setBreakpointTokens` / `setThemeTokens`: additive, partial map.

```ts
import { setBreakpoints } from "nice-styles"

setBreakpoints({
  laptop: 1100,
  desktop: 1800,
})
```

Effects, in this order:

1. Mutates `BREAKPOINTS` in place — `getBreakpoint`, `getBreakpointValue`, and
   any other reader pick up the new values immediately.
2. Re-emits the size-token `@media` cascade and injects it into a
   `<style data-nice-breakpoints>` element appended to `<head>`. The injected
   stylesheet has higher cascade weight than `tokens.css` (later in source
   order), so semantic vars start switching at the new thresholds.

Omitted breakpoints are preserved.

### React equivalent — `createTokens`

`createTokens` detects a top-level `breakpoints` key and forwards it to
`setBreakpoints` internally. Same precedent as component-prefix keys
(`button`, `icon`, etc.):

```ts
import { createTokens } from "nice-react-styles"

createTokens({
  fontSize: { base: "16px" },
  breakpoints: { laptop: 1100, desktop: 1800 },
})
```

---

## Build-time vs runtime — when to use which

| You want… | Use |
|-----------|-----|
| Frozen thresholds shipped in `dist/tokens.css` | `tokens/breakpoints.json` + rebuild |
| Live overrides without rebuilding | `setBreakpoints` at app startup |
| Per-app thresholds in a React project | `createTokens({ breakpoints: … })` |

The two paths are layered: runtime overrides win over build-time literals via
cascade order. A consumer can ship a build-time default and let one app
override it at runtime.

---

## API reference

### `getBreakpoint(name, exact?)`

Returns the `@media` query string (including the `@media` prefix).

```ts
getBreakpoint("phone")             // → "@media (max-width: 640px)"
getBreakpoint("laptop")            // → "@media (min-width: 1280px)"
getBreakpoint("tablet", true)      // → "@media (min-width: 641px) and (max-width: 1279px)"
```

### `getBreakpointValue(name)`

Returns the pixel threshold as a number. For `phone` (the derived base),
returns its ceiling — `tablet − 1`.

```ts
getBreakpointValue("laptop")   // → 1280
getBreakpointValue("phone")    // → 640  (tablet − 1)
```

### `setBreakpoints(overrides)`

Runtime override. Accepts `Partial<BreakpointValues>` — any subset of the
editable floors `tablet` / `laptop` / `desktop`. `phone` is the derived base
and cannot be set.

```ts
setBreakpoints({ tablet: 700, laptop: 1100 })
```

### `BREAKPOINTS`

Mutable typed object with stable identity. Readers see overrides without
re-importing. Do not reassign — call `setBreakpoints` instead.

```ts
import { BREAKPOINTS } from "nice-styles"
// { tablet: 641, laptop: 1280, desktop: 1720 }
```

---

## Why CSS variables can't drive `@media`

The CSS spec does not allow `var()` inside `@media` query conditions. That is
why thresholds are baked into `tokens.css` at build time and re-emitted as
a separate stylesheet at runtime, rather than reading from a CSS custom
property. The same constraint applies to every design system — runtime
threshold changes require either re-rendering CSS or a CSS Houdini paint.
Nice uses the former.
