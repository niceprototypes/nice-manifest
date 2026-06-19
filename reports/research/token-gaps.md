# Token Set Gaps — Prioritized

Research report on missing modules/tokens in `nice-styles`. Prioritization
uses two axes: **evidence of need** (hardcoded values in components +
re-additions in consumer `setTokens` maps) and **belongs-in-core?** (motion
curves and layering are app-agnostic and core-owned; brand hues are
app-specific and only the *slot* is core's concern).

Date: 2026-06-13. Sources are files read this session; every claim is tagged.

---

## Existing module inventory (16 modules)

| Module | Variants | Notes |
|--------|----------|-------|
| animationDuration | base 300ms, slow 600ms | no sub-300ms tier |
| animationEasing | **base only** (ease-in-out) | single curve |
| backgroundColor | base, dark (+night) | |
| backgroundSize | contain, cover, fill, none, scale-down | |
| borderColor | base, dark, darker (+night) | |
| borderRadius | smaller…larger | |
| borderWidth | none, small, base, large | |
| boxShadow | base, large | |
| cellHeight | smaller…larger | |
| color | base/light/lighter/lightest/disabled/link/success/warning/error (+night) | neutrals + semantic only; **no brand/accent** |
| fontFamily | base, code, heading | |
| fontSize | smaller…larger (breakpoint-driven) | tops out at `larger` |
| fontWeight | light…black (7) | |
| gap | none, smaller…larger | |
| letterSpacing | tight, base, wide, wider | **absent from manifest token table — doc gap** |
| lineHeight | single, condensed, base, expanded | |

`[verified: styles/src/tokens/modules/*.json, styles/src/generated/types.ts:9-10]`

---

## Prioritized gaps

### P0 — high need, app-agnostic, core-owned

#### 1. animationEasing — expand beyond `base`
- **Current:** `AnimationEasingType = "base"` (only `ease-in-out`). `[verified: styles/src/generated/types.ts:10, animationEasing.json]`
- **Evidence of need:** `FadeOnScroll.styles.ts:5` hardcodes `linear`; Button/Input/Sticky all hardcode `ease-in-out` rather than reading the token. `[verified: grep transition declarations]`
- **Proposed variants** (curves are universal, not app-specific): `linear`, `in` (ease-in), `out` (ease-out), `base` (keep `ease-in-out`), plus an emphasized/standard pair for entrances/exits (e.g. `emphasized: cubic-bezier(0.2,0,0,1)`). Exact curves are a design decision — values above are a starting proposal, not prescriptive.
- **Why P0:** explicitly requested; `linear` is already hardcoded, so at least that variant is provably needed today.

#### 2. animationDuration — add a sub-300ms tier
- **Current:** `base 300ms`, `slow 600ms`. No fast tier. `[verified: animationDuration.json]`
- **Evidence of need:** micro-interactions hardcode short durations the scale can't express — Button `0.15s` (`Button.styles.ts:65`), Input `0.15s` (`Input.styles.ts:53`), FadeOnScroll `0.1s` (`FadeOnScroll.styles.ts:5`). `[verified: grep]`
- **Proposed:** add `faster` (~100ms) and `fast` (~150ms); keep `base`/`slow`. Maps the three hardcoded values onto tokens.
- **Why P0:** pairs with #1 — together they let Button/Input/FadeOnScroll drop all hardcoded transition literals, matching the Slider pattern (`Slider.styles.ts:25` already reads both tokens). `[verified]`

#### 3. zIndex — new shared layering module
- **Current:** no shared module. Lightbox uses a component-scoped `getLightboxToken("zIndex")` (`Lightbox.styles.ts:14`); Sticky hardcodes `z-index: 100` (`Sticky.styles.ts:9`). `[verified: grep z-index]`
- **Evidence of need:** two different stacking contexts solved two different ways; no single scale to reason about layering across Sticky / Lightbox / future dropdowns/toasts.
- **Proposed:** `base`, `raised`, `dropdown`, `sticky`, `overlay`, `modal`, `toast` on a spaced numeric scale. Migrate Sticky's `100` and Lightbox's component token onto it.

### P1 — clear need, partly app-specific (core owns the slot)

#### 4. fontSize display/jumbo tier above `larger`
- **Current:** scale ends at `larger` (28px phone / 32px laptop). `[verified: fontSize.json]`
- **Evidence of need:** consumers repeatedly add a bigger tier — website-ocean adds `jumbo: 64px` and overrides `larger` to 48px; website overrides `larger` to 44–48px. `[verified: website-ocean/src/nice/tokens.ts, website/src/nice/tokens.ts]`
- **Proposed:** add a `display` (or `jumbo`) variant above `larger`. Apps still set the px values; core defines the slot in the scale + type union so it isn't a custom token per app.

#### 5. overlay / scrim color
- **Current:** none. Lightbox hardcodes `rgba(0,0,0,0.9)` for its backdrop (`Lightbox.styles.ts:19`). `[verified: grep]`
- **Proposed:** a `color.overlay` (or `backgroundColor.overlay`) variant with day/night values, so scrims are themable rather than a fixed black.

### P2 — note, lower urgency or inherently app-specific

#### 6. Brand/accent color slots
- Every content site re-adds `brandColor` (primary/secondary/tertiary/mint) and `projectColor` via `setTokens`. `[verified: website/src/nice/tokens.ts]`
- Hues are app-specific, so core can't pick values — but it could define a neutral `primary`/`accent` *slot* in `color` so components have a semantic brand hook instead of every app inventing `brandColor`. Decision-needed, not a clear-cut add.

#### 7. focus-ring token (a11y)
- No focus-visible styling exists; components set `outline: none` with no replacement (Button tracks `isFocused` state but renders no ring). `[verified: grep outline, Button.styles.ts]`
- A `focusRing` color/width token would back a consistent `:focus-visible` treatment. Primarily a component fix; the token is the enabling piece.

#### 8. opacity scale — LOW. Only one hardcoded `opacity: 1` found. `[verified: grep]` Not worth a module yet.

#### 9. gradient module — consumer `website` defines day/night/brand gradients. `[verified]` Inherently app-specific; leave to consumer `setTokens`.

---

## Documentation gaps (fix in manifest, not code)

- `letterSpacing` module exists on disk but is **missing from** `read/styles/tokens.md` → "Token Groups" table. `[verified: modules/letterSpacing.json exists; tokens.md table omits it]`
- `lineHeight` variants in the manifest table read `condensed, base, expanded` but the JSON also has `single`. `[verified: lineHeight.json]`
- `borderWidth` manifest table says `base, large`; JSON has `none, small, base, large`. `[verified: borderWidth.json]`

---

## Recommended sequence

1. **P0 #1 + #2 together** (easing + duration) — highest leverage: app-agnostic, already-hardcoded values prove the need, and they let four components drop transition literals. One nice-styles change + four component migrations.
2. **P0 #3 zIndex** — independent; resolves two divergent stacking solutions.
3. **P1 #4 display size, #5 overlay** — small, evidence-backed scale/slot additions.
4. Fix the three manifest doc-table gaps in the same cycle (cheap, prevents typed-value mistakes).

https://www.youtube.com/watch?v=AyCwdW0DetQ&list=PLWzYrEdlV4O57JIUKJ9GUfdMQ9A6rkovy
https://www.youtube.com/watch?v=zzyx7cJ0tk8&list=PLWzYrEdlV4O4vDWYUTtLnkeATXvTmgPkX&pp=0gcJCeECOCosWNin
https://www.youtube.com/watch?v=1Lb_kzuy8Nc&list=PLWzYrEdlV4O68NhWcepPH1YJ8ttcGsSh-
https://www.youtube.com/watch?v=D3KfLzGn6l0&list=PLWzYrEdlV4O6LM5JajOY5b36C6gegi8xG
https://www.youtube.com/watch?v=izhliJIZ2ms&list=PLWzYrEdlV4O7O67xiXvEq-_eLPThqcMvU
https://www.youtube.com/watch?v=gEkGbjclunE&list=PLWzYrEdlV4O6ahip_wUGNO-k7sO06OWyf
https://www.youtube.com/watch?v=IvkDRzI5C_U&list=PLWzYrEdlV4O4984CubvK7utgsYrtmT1SX
https://www.youtube.com/playlist?list=PLWzYrEdlV4O4N5U5ZbWe_CQjOzYyU9vUt
https://www.youtube.com/watch?v=9rakBLj2e5o&list=PLWzYrEdlV4O6gMwoKMpjrcmJdv1RwBSXz
https://www.youtube.com/watch?v=RbAQnW3qxRY&list=PLWzYrEdlV4O5o5GKepTGPx7tcow3aR-Jj
https://www.youtube.com/watch?v=_vgnXOWptJ0&list=PLWzYrEdlV4O64nHl_gNhJ54-7x0OVC8t5
https://www.youtube.com/watch?v=xUAzSHxRzMs&list=PLWzYrEdlV4O68nIa_bZtBS5d-B4oDC_FB
https://www.youtube.com/watch?v=9_Q-io-m88c&list=PLWzYrEdlV4O70GJsf4ZoN0NafyA3p4ZuR