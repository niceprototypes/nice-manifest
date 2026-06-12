o# Replacing `lucide-react` — Research

**Date:** 2026-05-23
**Goal:** Eliminate the `lucide-react` runtime dependency in `nice-react-icon-vendor` **while preserving Lucide as the fallback icon set**. The user explicitly does *not* want to eliminate the Lucide *icons* — just the React middleware.
**Consumer constraint:** the `<Icon vendor name="…" />` API on `nice-react-icon` must be unchanged. Consumers reach vendor icons today by installing `nice-react-icon-vendor` (which side-effect-registers a resolver) and rendering `<Icon vendor name="TrendingDown" />`. That call path stays identical.

---

## Current surface

| File | Lines | Role |
|---|---|---|
| `react-icon-vendor/src/services/resolveVendorIcon.ts` | 15 | `import { icons } from "lucide-react"` → looks up the React component by name, returns it. |
| `react-icon-vendor/src/index.ts` | 7 | Side-effect: `registerVendorResolver(resolveVendorIcon)` at module load. |
| `react-icon-vendor/package.json` | — | `dependencies: { lucide-react: ^0.545.0 }` |

Everything else (`<Icon vendor>` prop, the vendor-resolver mechanism inside `nice-react-icon`) lives outside this package and stays as-is.

---

## What `lucide-react` actually ships

`lucide-react@0.545` is itself a ~30-LOC React wrapper over Lucide's framework-agnostic icon-node data. Inspected directly in `node_modules`:

```js
// dist/esm/icons/a-arrow-up.js
const __iconNode = [
  ["path", { d: "m14 11 4-4 4 4", key: "1pu57t" }],
  ["path", { d: "M18 16V7", key: "ty0viw" }],
  ["path", { d: "m2 16 4.039-9.69a.5.5 0 0 1 .923 0L11 16", key: "d5nyq2" }],
  ["path", { d: "M3.304 13h6.392", key: "1q3zxz" }],
]
const AArrowUp = createLucideIcon("a-arrow-up", __iconNode)
export { __iconNode, AArrowUp as default }
```

`createLucideIcon` is a 15-line factory that calls `forwardRef` around an `Icon` component. `Icon` is a 30-line `forwardRef` that renders `<svg>` with default attrs and maps `iconNode.map(([tag, attrs]) => createElement(tag, attrs))`.

**The data is the value.** The React component layer is a trivial render. nice has every reason to own that 30 LOC and remove the React wrapper from the dependency graph.

---

## The `lucide` (framework-agnostic) package

Per the lucide-icons monorepo on GitHub (`packages/lucide/src/`), the framework-agnostic `lucide` package ships:

| File | Purpose |
|---|---|
| `icons/*.ts` | Per-icon `iconNode` tuple arrays (same shape as `lucide-react`'s `__iconNode`) |
| `iconsAndAliases.ts` | Aggregate export of every icon by PascalCase name |
| `defaultAttributes.ts` | The `xmlns`, `viewBox: "0 0 24 24"`, `stroke: currentColor`, `strokeWidth: 2`, `strokeLinecap: round`, `strokeLinejoin: round` defaults |
| `createElement.ts` | Generic element-creator used by the DOM helpers |
| `replaceElement.ts`, `lucide.ts` | DOM-level helpers (replace `<i data-lucide="name">` with `<svg>`) — irrelevant for React consumers |
| `types.ts` | TypeScript types for the icon-node shape |
| `aliases/` | Optional name aliases (renamed icons that keep old names usable) |

Tree-shakeable: per-icon ESM imports work. Bundle cost for a single icon is roughly the iconNode tuple itself (~100–400 bytes).

**This is exactly what we need.** The data + types are framework-agnostic; React rendering becomes a nice-owned 30-LOC concern.

---

## Replacement architecture

```
┌─ nice-react-icon (unchanged) ──────────────────────────────┐
│  <Icon vendor name="TrendingDown" />                       │
│      │                                                     │
│      ▼  via vendor-resolver hook                           │
│  resolveVendorIcon(name) → React.ComponentType | null      │
└────────────────────────────────────┬────────────────────────┘
                                     │
                                     ▼
┌─ nice-react-icon-vendor (rewritten, ~50 LOC) ──────────────┐
│  import { icons } from "lucide"   ← data only              │
│                                                            │
│  resolveVendorIcon(name)                                   │
│   ├─ look up icons[name] → iconNode tuple                  │
│   └─ return a React.FC that renders <svg>...iconNode</svg> │
│      via a single internal renderer (~25 LOC)              │
└────────────────────────────────────────────────────────────┘
```

The consumer-facing API at the `<Icon>` level **does not change**. The vendor resolver continues to return a React component; consumers continue to register the package via the same side-effect import.

### Internal renderer (sketch)

```ts
// react-icon-vendor/src/components/VendorIcon.tsx
import * as React from "react"
import type { IconNode } from "lucide"

const DEFAULTS = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const

interface VendorIconProps {
  iconNode: IconNode
  size?: number | string
  // …whatever forwarded props the consumer needs;
  // these mirror what lucide-react's <Icon> accepted
}

export const VendorIcon = React.forwardRef<SVGSVGElement, VendorIconProps>(
  ({ iconNode, size = 24, ...rest }, ref) =>
    React.createElement(
      "svg",
      { ref, ...DEFAULTS, width: size, height: size, ...rest },
      iconNode.map(([tag, attrs]) => React.createElement(tag, attrs))
    )
)
```

### Resolver (rewrite)

```ts
// react-icon-vendor/src/services/resolveVendorIcon.ts
import * as React from "react"
import { icons } from "lucide"               // ← only Lucide surface used
import { VendorIcon } from "../components/VendorIcon"

export function resolveVendorIcon(name: string): React.ComponentType | null {
  const iconNode = icons[name as keyof typeof icons]
  if (!iconNode) return null
  const Bound: React.FC = (props) => React.createElement(VendorIcon, { ...props, iconNode })
  Bound.displayName = name
  return Bound
}
```

That's the entire replacement — one new ~25-line component file, a rewritten 10-line resolver, dependency swap in `package.json`.

---

## What this buys

| Concern | Before | After |
|---|---|---|
| Runtime React dependencies that aren't `react` itself | `lucide-react` (entire React wrapper, factory, mergeClasses helpers, multi-`.d.ts` typings) | None — just our own ~30-LOC component |
| Coupling to upstream React behaviour decisions | `lucide-react` may change forwardRef shape, displayName logic, className merging | We control our renderer; only the data updates with Lucide upgrades |
| Bundle size for a consumer importing one vendor icon | Lucide's component + Icon renderer + createLucideIcon + mergeClasses helpers + tree-shake-defeating named export of `icons` | Single iconNode tuple + our 30-LOC component (shared across all vendor icons) |
| nice manifest alignment | `lucide-react` listed as a 3rd-party runtime dep in `research/third-party-libraries.md` (Replace Benefit 8) | One row closed; `lucide` itself remains (data-only, that's the intended outcome per user constraint) |

---

## What this does NOT change

- **Icon set coverage.** Same ~1500 Lucide icons available, same names, same SVG paths.
- **Update cadence.** `lucide` and `lucide-react` ship together with identical icon coverage; bumping `lucide` is operationally identical to bumping `lucide-react` today.
- **The `<Icon vendor name="…" />` API.** Consumer code is byte-identical.
- **The `--vendor` install gate.** Today's package-level opt-in (consumers `npm install nice-react-icon-vendor` and import once for the side effect) stays. No call-site changes anywhere.

---

## Risks

| Risk | Mitigation |
|---|---|
| `lucide` package's export shape differs subtly between major versions | Same risk exists today with `lucide-react`. Pin to the same version policy. |
| `displayName` differences in DevTools (lucide-react sets PascalCase displayName via `toPascalCase`) | Our resolver sets `Bound.displayName = name`. Identical net result for consumers who pass PascalCase names. |
| `lucide`'s `icons` export may not be tree-shakeable in named-aggregate form (today's `import { icons } from "lucide-react"` already isn't) | Same situation as today — no regression. If tree-shaking becomes critical, switch to per-icon dynamic imports later. |
| TypeScript types for icon-node may live in `lucide/types` rather than the top-level | Trivial — adjust the type import path. |

---

## Implementation steps (when scheduled)

1. **Verify `lucide` exports.** `npm view lucide` for version + check `package.json` `exports` field. Confirm `icons` object aggregate or use per-icon dynamic imports.
2. **Add `lucide` as a runtime dep, remove `lucide-react`.** Update `react-icon-vendor/package.json`.
3. **Write `VendorIcon` component** under `react-icon-vendor/src/components/VendorIcon/`. Follow the standard component layout per `edit/component.md`.
4. **Rewrite `resolveVendorIcon`** to look up iconNode from `lucide`'s `icons` and return a `Bound` React component wrapping `VendorIcon`.
5. **Build + verify** — same `npm pack --dry-run` size comparison before/after.
6. **Bump `nice-react-icon-vendor`** to major (runtime dep change, even though API is unchanged) and record in `.nice/bump.md`.
7. **Visual regression:** render a sample of website-used vendor icons in storybook before/after; confirm pixel-identical output.

---

## Recommendation

Proceed with the swap. The work is small (~50 LOC net), the consumer API doesn't move, and the operational outcome is exactly what `research/third-party-libraries.md` originally proposed for `lucide-react` (Replace Benefit 8, Replace Complexity 3) — minus the part the user explicitly carved out (don't drop Lucide icons themselves).

After this lands, `research/third-party-libraries.md`'s `lucide-react` row gets re-scoped: the React middleware is gone; the data dependency on `lucide` is retained intentionally. Update that table accordingly when the work ships.