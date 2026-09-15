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

Set thresholds with the reserved `breakpoints` key of `setTokens`
(`nice-react-styles`) or `generateTokenCSS` (`nice-styles`) — the same call
that sets tokens. Partial and additive: omitted breakpoints are preserved.

```ts
import { setTokens } from "nice-react-styles"

setTokens({
  breakpoints: { laptop: 1100, desktop: 1800 },
  fontSize: { base: { phone: "16px", "laptop+": "20px" } },
})
```

Effects, in this order:

1. **Validates** — only `tablet` / `laptop` / `desktop`, positive numbers,
   ascending after the merge. `phone`, unknown names, non-numbers, or
   out-of-order thresholds throw.
2. **Applies before the rest of the map** — mutates `BREAKPOINTS` in place, so
   `getBreakpoint`, `getBreakpointValue`, `useBreakpoint`, and the breakpoint
   values in the same call use the new thresholds.
3. **Re-emits the generated breakpoint cascade** — core breakpoint tokens and
   component aliases to them — into a `<style data-nice-breakpoints>` element
   (later in source order than `tokens.css`, so it wins).
4. **Regenerates earlier `setTokens` stylesheets** — every previously injected
   token map (last per prefix) is rebuilt, so its `+` / `-` breakpoint blocks
   move to the new thresholds.

`breakpoints: {}` or unchanged values are a no-op. There is no separate
breakpoint setter.

The custom-media aliases in `breakpoints.custom-media.css` resolve at the
consumer's build time and do not change with runtime thresholds.

---

## Build-time vs runtime — when to use which

| You want… | Use |
|-----------|-----|
| Frozen thresholds shipped in `dist/tokens.css` | `tokens/breakpoints.json` + rebuild |
| Live overrides without rebuilding | `setTokens({ breakpoints })` at app startup |

The two paths are layered: runtime overrides win over build-time literals via
cascade order. A consumer can ship a build-time default and let one app
override it at runtime.

---

## API reference

### `getBreakpoint(key)`

Returns the `@media` query string (including the `@media` prefix). The `key`
uses the same `+`/`-`/bare grammar as the `breakpoints` prop and breakpoint
values in `setTokens`:

- bare (`"tablet"`): exact — only that breakpoint's band.
- `"+"` (`"tablet+"`): up — that breakpoint and every larger (min-width).
- `"-"` (`"tablet-"`): down — that breakpoint and every smaller (max-width).

```ts
getBreakpoint("phone")    // → "@media (max-width: 640px)"   (exact band)
getBreakpoint("laptop+")  // → "@media (min-width: 1280px)"  (up)
getBreakpoint("tablet")   // → "@media (min-width: 641px) and (max-width: 1279px)"  (exact band)
getBreakpoint("tablet-")  // → "@media (max-width: 1279px)"  (down)
```

Base-spanning keys (`"phone+"`, `"desktop-"`) cover every viewport and resolve
to an always-true `@media (min-width: 0px)`.

### `getBreakpointValue(name)`

Returns the pixel threshold as a number. For `phone` (the derived base),
returns its ceiling — `tablet − 1`.

```ts
getBreakpointValue("laptop")   // → 1280
getBreakpointValue("phone")    // → 640  (tablet − 1)
```

### `setTokens({ breakpoints })`

Runtime override. `breakpoints` accepts `Partial<BreakpointValues>` — any
subset of the editable floors `tablet` / `laptop` / `desktop`. `phone` is the
derived base and cannot be set. See [Customizing — runtime](#customizing--runtime).

```ts
setTokens({ breakpoints: { tablet: 700, laptop: 1100 } })
```

### `BREAKPOINTS`

Mutable typed object with stable identity. Readers see overrides without
re-importing. Do not reassign — set thresholds through `setTokens({ breakpoints })`.

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
