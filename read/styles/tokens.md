# Token Naming Conventions

Design token naming patterns in nice-styles.

---

## CSS Variable Pattern

```
--np--{group}--{item}
--np--{prefix}--{group}--{item}
```

| Segment | Format | Examples |
|---------|--------|----------|
| np | fixed namespace | always `np` |
| prefix | kebab-case (component only) | `button`, `icon`, `tile`, `ink` |
| group | kebab-case | `font-size`, `color`, `border-radius` |
| item | kebab-case | `base`, `large`, `primary-hover` |

**Double dashes (`--`) separate segments. Single dashes within segments for compound words.**

### Core Token Examples

```
--np--font-size
--np--color--link
--np--border-radius--larger
--np--background-color--day      (mode primitive)
--np--color--night     (mode primitive)
```

### Component Token Examples

```
--np--button--size
--np--button--status-primary-base--background-color
--np--icon--color--error
--np--ink--font-size--larger
```

---

## TypeScript Naming

### Token Groups (camelCase)

```ts
getToken("fontSize")
getToken("color")
getToken("borderRadius")
```

### Token Items (camelCase or kebab)

The variant is the second positional argument of `getToken` (default
`"base"`); prefix / theme / breakpoint / inverse / pristine / `as` go in the
trailing options object.

```ts
getToken("fontSize", "base")
getToken("fontSize", "large")
getToken("color", "link")
```

### Type Names (PascalCase + Type suffix)

```ts
FontSizeType        // "smaller" | "small" | "base" | "large" | "larger"
ColorType // "lighter" | "light" | "medium" | ... | "error"
BorderRadiusType    // "smaller" | "small" | "base" | "large" | "larger"
ComponentPrefix     // "button" | "icon" | "tile" | "ink" (auto-generated)
```

---

## Token Groups

| Group | CSS Name | Items |
|-------|----------|-------|
| `animationDuration` | `animation-duration` | base, slow |
| `animationEasing` | `animation-easing` | base |
| `backgroundColor` | `background-color` | base, dark, success, warning, error, link (+ `$inverse` — see Inverse Colors) |
| `backgroundSize` | `background-size` | contain, cover, fill, none, scale-down |
| `borderColor` | `border-color` | base, dark, darker |
| `borderRadius` | `border-radius` | smaller, small, base, large, larger |
| `borderWidth` | `border-width` | base, large |
| `boxShadow` | `box-shadow` | base, large |
| `size` | `size` | smaller, small, base, large, larger |
| `fontFamily` | `font-family` | base, code, heading |
| `fontSize` | `font-size` | smaller, small, base, large, larger |
| `fontWeight` | `font-weight` | light, base, medium, semibold, bold, extrabold, black |
| `color` | `color` | base, light, lighter, lightest, disabled, link, success, warning, error (+ `$inverse` — see Inverse Colors) |
| `gap` | `gap` | none, smaller, small, base, large, larger |
| `lineHeight` | `line-height` | condensed, base, expanded |
| `zIndex` | `z-index` | base, low, medium, high, higher |

---

## Inverse Colors

The inverse of a color is the **opposite theme's** value — in day mode the night
color, in night mode the day color. `color` and `backgroundColor` carry an inverse
for every variant.

**Data — the `$inverse` reserved key.** Inverse values live inside the base
module (`color.json` / `backgroundColor.json`) under a reserved `$inverse` key,
a sibling of `$themes` / `$breakpoints`. It is a self-contained sub-module —
base (day) variants plus its own `$themes.night` — holding the swapped values:

```jsonc
// modules/color.json
{
  "base": "hsla(210,5%,5%,1)", …,                 // color day
  "$themes": { "night": { "base": "hsla(210,5%,95%,1)", … } },
  "$inverse": {
    "base": "hsla(210,5%,95%,1)", …,              // inverse day  = color night
    "$themes": { "night": { "base": "hsla(210,5%,5%,1)", … } }  // inverse night = color day
  }
}
```

There are **no** `colorInverse` / `backgroundColorInverse` modules — inverse is a
dimension of the base group, not a separate group.

**Var structure — `inverse` is a trailing `--inverse` segment** (a plain
double-dashed segment after the theme, *not* a camelCase fusion):

```
--np--color--inverse          semantic (reactive — flips with the theme)
--np--color--day--inverse     day primitive   = color night value
--np--color--night--inverse   night primitive = color day value
```

The semantic `--np--color--inverse` flips via `@media (prefers-color-scheme:
dark)` and `[data-theme]` pins exactly like a normal token, so a region styled with
the inverse pair renders as the opposite theme **without** a JS `data-theme`
wrapper, and it doesn't break when more themes are added.

**Seeded as string literals, not `var()`** — `$inverse.base` (day) is the literal
`hsla(210,5%,95%,1)`, not `var(--np--color--night)`. Inverse colors usually
need per-variant tweaking, so each is an editable value. Keep them hand-synced
with `color` / `backgroundColor`, or tweak freely.

**Reading an inverse:** the `inverse` option on the getter —
`getToken("color", undefined, { inverse: true })` → `var(--np--color--inverse)`,
`getToken("backgroundColor", "error", { inverse: true })`. Valid for
`color` / `backgroundColor` only (throws on groups with no `$inverse`). The
generated `{Group}InverseType` (`ColorInverseType`, …) is the inverse variant union.

**Adding a 3rd theme:** add a `$themes.{name}` entry inside each `$inverse` block
with the inverse you want for that theme — there is no automatic opposite beyond
day↔night.

---

## Size Scale Pattern

Standard size progression:

```
smaller → small → base → large → larger
```

Used by: `borderRadius`, `size`, `fontSize`, `gap`

---

## Token Source Files

JSON sources split into two scopes — module-level (cross-component) under `modules/`, and component-level (per-prefix) under `components/`. Both scopes are **folders of one-file-per-key**: `modules/{group}.json` (one per token group) and `components/{prefix}.json` (one per component). Breakpoint and alt-theme overrides live **inside** each file under the reserved `$breakpoints` and `$themes` keys.

```
nice-styles/src/tokens/
├── modules/                     ← one file per token group
│   ├── color.json               ← base + $themes (alt themes inline)
│   ├── backgroundColor.json
│   ├── borderColor.json
│   ├── fontSize.json            ← $breakpoints only (no top-level base)
│   ├── gap.json
│   ├── borderRadius.json
│   └── …                        ← one per group (18 today)
├── breakpoints.json             ← breakpoint pixel thresholds (separate concern)
└── components/
    ├── button.json              ← per-component base + $themes (alt themes inline)
    ├── icon.json
    ├── image.json
    ├── input.json
    ├── lightbox.json
    ├── tile.json
    └── ink.json
```

Key order inside each file mirrors the CSS cascade so the JSON reads top-to-bottom in the same direction styles resolve:

1. **Base groups** (e.g. `color`, `fontSize`, `gap`) — the unconditional default.
2. **`$breakpoints`** — viewport-conditional overrides, keyed by breakpoint name (`tablet`, `laptop`, `desktop`).
3. **`$themes`** — user-preference overrides, keyed by alt-theme name (`night`, …).

Themes are emitted last in `dist/tokens.css`, so on overlap (a token overridden by both a breakpoint and a theme) the theme wins — matching the existing canonical pattern of placing `prefers-color-scheme: dark` after `min-width` media queries.

### Module-level files

- **`modules/{group}.json`** — one file per cross-component token group; the filename stem is the group name (`color.json` → `color`). Top-level keys are that group's base variants, with reserved `$breakpoints` (keyed by breakpoint name) and `$themes` (keyed by alt-theme name) holding overrides **scoped to that group**:
  ```json
  // modules/color.json
  {
    "base":  "hsla(210, 5%, 5%, 1)",
    "light": "hsla(210, 5%, 25%, 1)", ...,
    "$themes": {
      "night": { "base": "hsla(210, 5%, 95%, 1)", "light": "...", ... }
    }
  }
  ```
  ```json
  // modules/fontSize.json — purely breakpoint-driven; no top-level base
  {
    "$breakpoints": {
      "phone":   { "smaller": "11px", "base": "14px", ... },
      "tablet":  { ... },
      "laptop":  { "smaller": "12px", "base": "16px", ... },
      "desktop": { ... }
    }
  }
  ```
  Each `$themes` / `$breakpoints` entry is partial — only the variants that differ. A theme override MUST NOT introduce a variant absent from the group's base; the base is the registration site. The exception is a **purely breakpoint-driven group** like `fontSize`, which carries no top-level base — its `phone` dimension *is* the default (`phone` is the implicit default breakpoint).

  **Adding a token group = drop one `modules/{group}.json`.** The build globs the folder — no script edits. Same philosophy as `components/`.
- **`breakpoints.json`** pixel-threshold table for the breakpoint names (a separate concern from breakpoint-conditional token values — this file defines *when* a breakpoint is active, not *which tokens* it overrides).

### Component-level files

- **`components/{prefix}.json`** holds the comprehensive base for one component prefix at the top level. Token values are raw CSS strings; cross-references use `var()`. Alternative themes live under the same reserved `$themes` key as module-level files:
  ```json
  {
    "size":         { "smaller": "var(--np--size--smaller)", ... },
    "borderRadius": { ... },
    "icon":         { "size": { "base": "var(--np--font-size)", ... } },
    "$themes": {
      "night": {
        "icon": { "color": { ... } }
      }
    }
  }
  ```
  Every component file today carries an empty `$themes.night`; alias values (`var(--np--…)`) follow the core token's themes automatically (see auto-propagation below).

  **Components support `$breakpoints` too** — the same reserved key modules use, with each breakpoint holding a partial mirror of the (nested) base tree. So both axes are available in both scopes:

  ```json
  {
    "size": { "base": "var(--np--size)", ... },
    "$breakpoints": {
      "laptop": { "size": { "base": "var(--np--size--large)" } }
    },
    "$themes": {
      "night": { "icon": { "color": { ... } } }
    }
  }
  ```

  Each `$breakpoints` / `$themes` entry is partial — only the paths that differ from the base. A `night` theme is special (it is the OS dark default, see Theme Architecture); any other `$themes` name and every `$breakpoints` name validate against the base tree and emit pin / `min-width` overrides.

Adding a new component package = drop one `components/{prefix}.json`. The build picks it up automatically via filename glob — no script edits.

#### Component alias auto-propagation (theme / breakpoint reactivity)

A component token whose value is a **bare alias** to a core token —
`"light": "var(--np--color--light)"` — automatically tracks every scope the
referenced core participates in. The generator (`src/utilities/css/componentAliasCss.ts`)
emits a parallel reassignment of the component var into each
`[data-theme="day"]` / `[data-theme="night"]` pin, the
`@media (prefers-color-scheme: dark)` block, and any `@media (min-width)`
breakpoint block, pointing at the core's stable primitive
(`var(--np--color--light--night)`, `var(--np--font-size--laptop)`, …). No new
primitives are minted — it reuses the core's.

**Why it exists:** a component alias declared only at `:root` freezes its
`var()` at `:root` scope (CSS custom-property substitution), so a
`[data-theme="night"]` pin — which reassigns the *core* token, not the
component token — never reaches it. The component color would silently follow
`:root`/OS instead of the pin. Auto-propagation closes that gap so **every
component token is theme- and breakpoint-correct without per-file authoring**.

**Precedence:** authored `$themes.{theme}` / `$breakpoints.{bp}` overrides win
per-variant — the auto pass skips any path+scope an authored override owns, so
partial authoring composes (authored variants use the authored value, the rest
auto-propagate). Component tokens holding a **distinct literal** value (e.g.
button `status` colors) have no core counterpart to derive from and so still
require authored `$themes` to theme — that path is unchanged.

**Convention:** component styles should resolve through their own component
token (`getToken("{component}.{name}:{variant}")`), never a core/root
var directly. Core vars are for loose use in consumer/app code. Because aliases
auto-propagate, routing a component prop through its component token is always
theme-correct.

### Auto-Generated Files

Build scripts (`scripts/generate*/`) read the JSON sources and output:

```
nice-styles/src/generated/
├── types.ts                       ← token type unions, ComponentPrefix
├── tokensData.ts                  ← static core tokens as TS object
├── themeTokensData.ts             ← theme-keyed tokens as TS object ({day, night})
├── breakpointTokensData.ts        ← breakpoint-keyed tokens as TS object
├── componentTokensData.ts         ← component tokens (day branch) as TS object
└── breakpointsData.ts             ← pixel thresholds
```

The generators reconstitute the `{day, night}` split for runtime consumption — `themesData.day` is computed by splitting the `modules/` themed groups out of the base. Runtime registry and CSS emission both still address the base theme as `"day"`; the JSON layer alone elides the wrapper.

---

## Import Guidance

In React projects, import all nice-styles assets from `nice-react-styles`, which re-exports the entire nice-styles public API. Import directly from `nice-styles` only when working outside the React framework (e.g., vanilla JS, build scripts, non-React tooling). Either import path is valid — they resolve to the same functions.

```ts
// React projects
import { getToken, getBreakpoint, type FontSizeType } from "nice-react-styles"

// Non-React contexts
import { getToken, getBreakpoint, type FontSizeType } from "nice-styles"
```

---

## getToken

The single token getter. Reads one registry — seeded at module load from all generated token data, extended at runtime by `setTokens` — for every token kind: core, custom, theme, breakpoint, inverse, and component.

```ts
getToken(
  name: string | string[],        // token group, or a nested group path (component tokens)
  variant = "base",
  options?: {
    prefix?: string               // component prefix ("button", "icon", …)
    theme?: string                // pin to a theme primitive
    breakpoint?: string           // pin to a breakpoint primitive
    inverse?: boolean             // inverse-color dimension
    pristine?: boolean            // generated defaults only, ignoring setTokens overrides
    as?: "var" | "key" | "value"  // default "var"
  }
): string
```

```ts
import { getToken } from "nice-react-styles"

getToken("fontSize")                                      // → "var(--np--font-size)"
getToken("fontSize", "large")                             // → "var(--np--font-size--large)"
getToken("fontSize", "base", { as: "key" })               // → "--np--font-size"
getToken("fontSize", "base", { as: "value" })             // → "14px"
getToken("color", "base", { theme: "night" })             // → "var(--np--color--night)"
getToken("fontSize", "large", { breakpoint: "laptop" })   // → "var(--np--font-size--large--laptop)"
getToken("backgroundColor", "base", { inverse: true })    // → "var(--np--background-color--inverse)"
getToken("button.spacing:large")                          // → "var(--np--button--spacing--large)"
getToken("button.icon.size:small")                        // → "var(--np--button--icon--size--small)"
```

Rules:
- **Layers:** `as: "value"` reads the `setTokens` override first, then the generated default, per theme and per breakpoint — the same order as the injected stylesheet over `tokens.css`.
- **Unregistered name:** the `var` / `key` forms return the computed name and warn once if it is still unregistered after module loading finishes, so a read that runs before `setTokens` is not an error. The `value` form throws.
- **Theme pin:** throws when the token has no value for that theme.
- **Breakpoint pin:** the `var` / `key` forms throw unless a generated `--{breakpoint}` primitive exists; `as: "value"` resolves the value active at that breakpoint.

### Usage in styled-components

```ts
import { getToken } from "nice-react-styles"

const StyledDiv = styled.div`
  font-size: ${getToken("fontSize", "large")};
  color: ${getToken("color", "light")};
`
```

---

## getConstant (nice-styles)

Builds CSS variable names following the `--np--` convention. Name only — no registry lookup, no validation. To read a registered token, use `getToken`. `getConstantKey` returns the bare name.

### Signature

```ts
getConstant(token: string | string[], param: string, options?: { theme?: string; breakpoint?: string; pkg?: string; inverse?: boolean }): string
getConstantKey(token: string | string[], param: string, options?: { theme?: string; breakpoint?: string; pkg?: string; inverse?: boolean }): string
```

### Examples

```ts
import { getConstant, getConstantKey } from "nice-react-styles"

getConstant("backgroundColor", "base")                   // → "var(--np--background-color)"
getConstant("backgroundColor", "base", { theme: "day" }) // → "var(--np--background-color--day)"
getConstant("color", "base", { theme: "night" })         // → "var(--np--color--night)"
getConstant("size", "small", { pkg: "button" })          // → "var(--np--button--size--small)"
getConstantKey(["icon", "size"], "base", { pkg: "button" }) // → "--np--button--icon--size"
```

`base` contributes no segment anywhere in the name, including inside a group path.

**Never construct `--np--` strings by hand — use `getToken` for registered tokens and `getConstant` / `getConstantKey` for names outside the registry.**

---

## Component tokens

Component tokens are read with `getToken` using an address whose first dotted segment is the component: `"button.icon.size:small"`. Values live in `nice-styles/src/tokens/components/{prefix}.json`. Dots carry the namespace and group path, the first colon carries the variant — group, variant, and effect names never contain a dot or a colon.

```ts
import { getToken } from "nice-react-styles"

getToken("button.size:base")                                    // → "var(--np--button--size)"
getToken("icon.color:error")                                    // → "var(--np--icon--color--error)"
getToken("button.icon.size:small")                              // → "var(--np--button--icon--size--small)"
getToken("lightbox.zIndex:base", { as: "value" })               // → "9999"
```

Valid prefixes are listed by the `ComponentPrefix` type (auto-generated from `src/tokens/components/*.json` filenames). Component packages have no per-package `get{Component}Token` wrappers.

---

## Token Registry

One store in nice-styles (`src/registry/`), re-exported by nice-react-styles. Generated tokens are seeded at module load; custom tokens and overrides are added with `setTokens()` or `registerTokens()`. `breakpoints` is a reserved group holding the breakpoint floors (`getToken("breakpoints:laptop")`), seeded from `breakpoints.json` and updated when `setTokens({ breakpoints })` changes one. Read single tokens with [`getToken`](#gettoken) and enumerate with [`listTokens`](#listtokens--enumerate-tokens).

```ts
import { getToken } from "nice-react-styles"

getToken("fontSize")                                     // "var(--np--font-size)" — seeded, always available
getToken("backgroundColor", "base", { theme: "night" })  // "var(--np--background-color--night)"
getToken("brandColor", "primary")                        // "var(--np--brand-color--primary)" — after setTokens
```

### setTokens — Register + Generate CSS

Registers app-level token overrides and custom tokens in the runtime registry, and sets breakpoint thresholds. Injects the generated CSS synchronously at call time; returns nothing. Call it once at module load (typically in `src/nice/tokens.ts`) and import that file for its side effect from your app entry.

```ts
import { setTokens, getToken } from "nice-react-styles"

const AppTokenMap = {
  // Breakpoint thresholds (reserved key) — applied before the rest of the map
  breakpoints: { laptop: 1100 },

  // Override core tokens
  fontSize: { base: "20px", larger: "40px" },

  // Custom tokens
  brandColor: { primary: "#dc0000" },

  // Theme-aware tokens
  headerColor: {
    base: { day: "#000", night: "#fff" },
  },
} as const

setTokens(AppTokenMap)
export { getToken }
```

**`breakpoints` key:** `tablet` / `laptop` / `desktop` pixel floors (`Partial<BreakpointValues>`). Validated (positive, ascending; `phone` and unknown names throw), applied before the rest of the map, and re-emits the breakpoint cascade plus every earlier `setTokens` stylesheet at the new thresholds. See [breakpoints.md](breakpoints.md#customizing--runtime).

**Generated CSS** (same shape as `dist/tokens.css`):
```css
:root {
  --np--font-size: 20px;
  --np--font-size--larger: 40px;
  --np--brand-color--primary: #dc0000;
  --np--header-color: #000;
  --np--header-color--day: #000;
  --np--header-color--night: #fff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --np--header-color: var(--np--header-color--night);
  }
}

[data-theme="day"] {
  color-scheme: light;
  --np--header-color: var(--np--header-color--day);
}

[data-theme="night"] {
  color-scheme: dark;
  --np--header-color: var(--np--header-color--night);
}
```

### registerTokens — Manual Registration

Directly register tokens without generating CSS.

```ts
import { registerTokens } from "nice-react-styles"

registerTokens({ brandColor: { primary: "#f00" } }, "app")
```

**Layering:** each variant writes the `runtime` layer of the entry for its CSS variable name. The generated `seed` layer is kept, and readers fall back to it for any theme or breakpoint the override does not cover.

### Direct registry access

The registry is exported as a `Map<string, TokenEntry>` keyed by CSS variable name. Each entry holds `prefix`, `path`, `variant`, `inverse`, and two value layers: `seed` (generated default) and `runtime` (`setTokens` / `registerTokens` override).

```ts
import { registry } from "nice-react-styles"

registry.has("--np--font-size")               // true
registry.get("--np--font-size--large")?.seed  // { phone: "20px", tablet: "20px", laptop: "24px", desktop: "24px" }
```

Seeding and `registerTokens` write through one function (`writeToken` in `registry/createRegistry.ts`), so generated and runtime entries carry the same metadata.

### transform — Adjust a colour's channels

`getToken(address, { transform })` adjusts a colour token's hsla channels and returns CSS relative color syntax, so the result stays a `var()` underneath and keeps following the theme cascade:

```ts
getToken("ink.color:highlight", { transform: [null, null, "*0.55", null] })
// "hsl(from var(--np--ink--color--highlight) h s calc(l * 0.55))"

getToken("color:base", { theme: "night", as: "value", transform: [null, null, "*0.5", null] })
// "hsla(210, 5%, 47.5%, 1)"   — the computed counterpart
```

Channels are `[hue, saturation, lightness, alpha]`. A `number` sets the channel, `"+30"` / `"-30"` shift it, `"*0.55"` scales it, and `null` (or an omitted entry) leaves it alone. Prefer ratios for anything that must hold in both themes — an offset sized for a light value leaves the gamut on its dark counterpart, and the browser saturates rather than failing.

`as: "key"` throws: a transformed colour has no variable name. `transformColor` shares the same channel vocabulary (`src/utilities/css/relativeColor.ts`) but computes a static `hsla()`, which does not follow the theme.

Component colour props take the same thing as an object — `<Ink color={{ name: "highlight", transform: [null, null, 40, null] }} />` — resolved through `resolveColorProp`.

### listTokens — Enumerate tokens

`listTokens(filter?)` lists registered tokens in one pass over the registry — the enumeration counterpart of `getToken`. Exported from nice-styles and nice-react-styles.

```ts
import { listTokens, getToken } from "nice-react-styles"

listTokens({ prefix: "button" })       // every button component token
listTokens({ group: "color" })         // color variants, base and inverse
listTokens({ source: "runtime" })      // tokens only setTokens created

for (const { path, variant, prefix, inverse } of listTokens({ group: "fontSize" })) {
  getToken(path, variant, { prefix, inverse, as: "value" })
}
```

Each listing: `{ key, prefix, path, variant, inverse, themes, breakpoints, source }`.

| Field | Meaning |
|---|---|
| `themes` | Theme names with a value in any layer (`[]` if unthemed) |
| `breakpoints` | Breakpoint keys with a value in any layer, including runtime ranges (`laptop+`) |
| `source` | `"seed"` (generated only), `"runtime"` (`setTokens` only), or `"both"` |

Filter (all optional, all must match): `prefix` (exact), `group` (first path segment), `variant`, `source` (exact).

---

## Token Source Modules (nice-styles)

Token values originate from per-group JSON files under `nice-styles/src/tokens/modules/` — one file per token group, each carrying the comprehensive base at its top level plus inline `$breakpoints` and `$themes` override sections **scoped to that group**. A shared reader (`scripts/shared/readModuleFolder.ts`) globs the folder and reassembles the combined object the build consumes. Per-component tokens live under `components/{prefix}.json` with the same internal shape.

### modules/{group}.json — Base + `$breakpoints` + `$themes`

Each file's top-level keys hold the group's base variants: static groups (`gap`, `borderRadius`, …) carry their values directly; theme-conditional groups (`color`, `backgroundColor`, `borderColor`) carry their default-theme values. Two reserved override sections may follow, scoped to that group:

- **`$breakpoints`** — keyed by `phone` / `tablet` / `laptop` / `desktop`. `phone` is the implicit default; higher breakpoints override via `min-width` media queries.
- **`$themes`** — keyed by alternative theme name (`night`, …). Partial — only the variants that differ from the base.

```json
// modules/gap.json — static group, no overrides
{ "none": "0", "smaller": "4px", "small": "8px", "base": "16px" }
```
```json
// modules/color.json — theme-conditional group
{
  "base": "hsla(210, 5%, 5%, 1)", "light": "hsla(210, 5%, 25%, 1)", …,
  "$themes": {
    "night": { "base": "hsla(210, 5%, 95%, 1)", "light": "hsla(210, 5%, 95%, 0.85)", … }
  }
}
```
```json
// modules/fontSize.json — breakpoint-driven; no top-level base, phone is the default
{
  "$breakpoints": {
    "phone":   { "base": "14px" },
    "laptop":  { "base": "16px" },
    "desktop": { "base": "18px" }
  }
}
```

```css
:root {
  --np--gap--none: 0;
  --np--font-size: 14px;
  --np--color: hsla(210, 5%, 5%, 1);
  --np--color--day: hsla(210, 5%, 5%, 1);
  --np--color--night: hsla(210, 5%, 95%, 1);
}
@media (min-width: 1280px) {
  :root { --np--font-size: var(--np--font-size--laptop); }
}
@media (min-width: 1720px) {
  :root { --np--font-size: var(--np--font-size--desktop); }
}
@media (prefers-color-scheme: dark) {
  :root { --np--color: var(--np--color--night); }
}
```

JSON key order within each file mirrors CSS cascade order: `base → $breakpoints → $themes`. On overlap (a token overridden by both a breakpoint and a theme), the theme wins by source-order precedence — matching the canonical pattern of placing `prefers-color-scheme: dark` after `min-width` media queries.

A theme override MUST NOT introduce a variant absent from the group's base — the generator validates night against day and throws on orphan overrides; the base is the registration site for every variant a theme can address. The exception is a purely breakpoint-driven group (`fontSize`), which carries no top-level base — its `phone` dimension *is* the default.

### Build Pipeline

One reader, `scripts/shared/readTokenSources.ts`, reads and validates the source JSON and returns a typed `TokenSourceModel` (`scripts/shared/types.ts`); each pipeline maps that model onto its output. Module-level files are discovered via a `modules/*.json` glob and reassembled by `readModuleFolder`; per-component files via a `components/*.json` glob. **Both scopes are zero-script-edit — adding a token group or a component package is just a new file.** `$breakpoints`, `$themes`, and `$inverse` overrides are always inline under the parent file.

| Script | Maps the model to |
|--------|-------------------|
| `scripts/generateTokens/` (`writeData.ts`) | `src/generated/tokensData.ts`, `themeTokensData.ts`, `breakpointTokensData.ts`, `inverseTokensData.ts`, `componentTokensData.ts`, `componentBreakpointTokensData.ts`, `breakpointsData.ts` |
| `scripts/generateTypes/` (`writeTypes.ts`) | `src/generated/types.ts` |
| `scripts/generateCss/` (`writeCss.ts`) | `dist/tokens.css`, `dist/css/{group}.css`, `dist/breakpoints.css`, `dist/breakpoints.custom-media.css` |

Model splits: groups that appear in any `$themes` entry are themed (`themes.day`), the rest are `core`; `night` is `themes.night` and every other theme is `themes.extras` (components split the same way); each `$inverse` sub-module becomes `inverse.day` / `inverse.night`. `generateTokens` writes `themeTokensData.ts` as `{ day, night }`.

Semantic defaults (`scripts/shared/semanticDefaults.ts`): `{ ...core, ...themes.day, ...breakpointTokens.phone }` — later keys win on collision. This map drives the semantic `:root` variables and the type unions. It lives outside the reader because it imports `src/constants/breakpoints.ts`, which needs `src/generated/` — only pipelines that run after `build:tokens` may import it.

---

## Variant Value Formats in setTokens

When calling `setTokens()` from nice-react-styles, variant values can be one of three formats. These can be mixed freely within the same token group. (Breakpoint *thresholds* are not a variant value — they go under the reserved top-level `breakpoints` key.)

### Static (string)

```ts
{ gap: { none: "0", base: "32px" } }
```

### Responsive (breakpoint object)

Detected by `isStyleValue("breakpoint", value)` — every key is a breakpoint key: bare (`phone`, exact band), `+` (up), or `-` (down).

```ts
{ gap: { base: { phone: "24px", "laptop+": "32px" } } }
```

Keys spanning every viewport (`phone+`, `desktop-`) land in `:root`; every other key is emitted in its `@media` block, least to most specific.

### Theme-aware (theme object)

Detected by `isStyleValue("theme", value)` — an object that is not a breakpoint map and has a `day` key. The two shapes are mutually exclusive.

```ts
{ headerColor: { base: { day: "#000", night: "#fff" } } }
```

Generates semantic variable + `--day` / `--night` primitives + `prefers-color-scheme` media query + `[data-theme]` pins (extra themes get their own pin).

### Mixed Example

```ts
setTokens({
  gap: {
    none: "0",                                  // static
    base: { phone: "24px", laptop: "32px" },    // responsive
  },
  headerColor: {
    base: { day: "#000", night: "#fff" },       // mode-aware
    accent: "#dc0000",                          // static
  },
})
```

---

## Theme Architecture

- **"day"** is the default theme (`DEFAULT_THEME` in nice-react-styles)
- **"night"** replaces "dark" for mode suffixes throughout the system
- Stable primitives: `--np--*--day` and `--np--*--night` are never reassigned
- `@media (prefers-color-scheme: dark)` maps semantic vars to `--night` primitives — this is the **default behavior** when no pin is set
- `color-scheme: light dark` on `:root` enables native browser dark scheme

### Arbitrary theme names

`night` is not the only possible theme — it is the **single theme wired to `@media (prefers-color-scheme: dark)`** (the OS dark default). Any *other* name under a `$themes` key (module or component), e.g. `sepia`, emits a stable `--np--…--{name}` primitive plus a `[data-theme="{name}"]` pin block, and is activated **only** by an explicit pin (`<Theme name="sepia">` / `data-theme="sepia"`) — there is no OS auto-switch for extra themes, since only one theme can own `prefers-color-scheme: dark`. Extra themes validate against the day base like night does. This is additive: the day/night path is unchanged.

### Pinning a region to a specific mode

`tokens.css` also emits two attribute-selector blocks that override the OS-preference cascade:

```css
[data-theme="day"]   { color-scheme: light; --np--color: var(--np--color--day);   /* …all mode vars */ }
[data-theme="night"] { color-scheme: dark;  --np--color: var(--np--color--night); /* …all mode vars */ }
```

The attribute selector outranks `@media (prefers-color-scheme: dark)`, so when `data-theme` is set on an element the pin wins. The reassignments cascade to every descendant — nice components, raw markup, third-party widgets that read `var(--np--…)` alike.

Three ways consumers pin:

| Approach | Code | Use when |
|---|---|---|
| Whole page | `<html data-theme="day">` | App-wide default that overrides OS preference (e.g. storybook). |
| Subtree via React | `<Theme name="day">{children}</Theme>` from `nice-react-styles` | Pin a region; uses a `<div style="display:contents">` so layout is unaffected. |
| Subtree via raw HTML | `<section data-theme="day">…</section>` | Same mechanism without React. |

### Component `theme` prop

Visual components (Ink, Tile, Button, Icon, Image, Input) implement their `theme` prop by wrapping their rendered output in `<Theme name={theme}>` when the prop is set. Consequences:

- Descendants of `<Tile theme="night">` automatically inherit night via the cascade — no need to set `theme` on each child.
- A child with its own `theme` prop pins itself (and its descendants), overriding the ancestor.
- Internal styled-components do **not** thread `$theme`; they reference semantic vars and rely on the cascade.

### Escape hatch — explicit primitive

The `theme` option on `getToken(name, variant, { theme })` returns the bare mode-primitive reference (`var(--np--…--day)` or `--night`) — bypassing the cascade entirely. Use only when an element inside a pinned region needs the opposite mode regardless of any ancestor pin (e.g. Button's inverted-mode text contrast).

### ThemeType (nice-styles)

Core type for theme props across the ecosystem. Extensible for consumer-defined custom themes.

```ts
import type { ThemeType } from "nice-react-styles"
// "day" | "night" | (string & {})
```

Component packages re-export as component-specific aliases:

```ts
// nice-react-ink
import type { InkThemeType } from "nice-react-ink"
// InkThemeType = ThemeType
```

Higher-level components (app code, wrapper components) import `ThemeType` from nice-react-styles:

```ts
import type { ThemeType } from "nice-react-styles"

interface MyComponentProps {
  theme?: ThemeType
}
```
