# `mode` Rename — Residual Cleanup Audit

**Date:** 2026-05-27
**Scope:** All `~/nice/*/src/`, `scripts/`, storybook config + stories, website code, and the entire manifest. Looking for residual `mode`/`Mode`/`modes` references in the **deprecated theming** sense after the `mode → theme` rename landed across the workspace (`mode-references.md` closed).
**Driver:** A grep sweep after the closed rename audit revealed ~30 remaining surfaces — code AND docs — that still speak the old vocabulary. They divide into two classes: (1) **API misalignments** that contradict the new contract and will break or confuse consumers, and (2) **doc/prose lag** that doesn't break anything but misleads readers. Each needs a deliberate disposition; this report scores them so the cleanup can be prioritized.

---

## Methodology

- Grep-and-verify across every workspace `src/`, `scripts/`, `dist/`, MDX stories, storybook config, and all `manifest/**/*.md` (excluding `manifest/.nice/sessions/` which is intentionally historical).
- Classify each hit as `identifier`, `option-key`, `prop-pass`, `jsdoc`, `prose`, or `stale-dist`.
- Filter out legitimate non-theming "mode" uses (Image render mode, Icon outlined mode, watch mode, debug mode, viewMode, etc.).
- Score each finding by **Benefit** (correctness/clarity value of fixing) and **Complexity** (engineering effort), both out of 10 — same scale as `manifest/.nice/reports/research/third-party-libraries.md`.

---

## Summary — sorted by ratio (Benefit ÷ Complexity)

| # | Finding | Side | Benefit | Complexity | Action |
|---|---|---|---|---|---|
| 1 | `storybook/.storybook/preview.tsx:64` — storySort entry `"Mode"` in React/Styles group | code | 7 | 1 | Change |
| 2 | `storybook/src/components/Intro/Intro.tsx:19` — `mode="day"` on `<Icon>` | code | 7 | 1 | Change |
| 3 | `storybook/stories/React/Components/Image/Mode.mdx` — file + meta + JSX prop values | code | 8 | 2 | Change |
| 4 | `storybook/stories/React/Styles/Mode.mdx` — canonical story for the `<Mode>` component | code | 9 | 3 | Change |
| 5 | `manifest/edit/component.md` — Pin-to-mode JSDoc, `withMode` helper code example, prose | doc | 8 | 3 | Change |
| 6 | `manifest/read/styles/tokens.md` — "Pinning a region to a specific mode" heading + prose + getToken third-arg description | doc | 8 | 3 | Change |
| 7 | `storybook/stories/Getting started/1.2-Themes.mdx` — prose mentions of "dark mode" + image asset path | code | 4 | 2 | Selective change |
| 8 | `storybook/stories/Getting started/3.2-Responsive.mdx:26` — `// mode` inline comment in a code block | code | 3 | 1 | Change |
| 9 | `dark-mode.png` raster asset path referenced in MDX prose/img src | code | 2 | 3 | Skip / defer |
| 10 | `react-button/src/components/Button/Button.tsx:38` — inlining-decision historical comment | code | 0 | 1 | **Keep** (intentional record) |

No stale-dist artifacts found across `nice-styles/dist/`, `nice-react-*/dist/`, `nice-react-styles/dist/` — every consumer is reading from rebuilt output.

---

## Detailed entries

### 1. `storybook/.storybook/preview.tsx:64` — story sort label

```ts
["Styles", ["StylesProvider", "FontLoader", "Mode", "getToken", "createTokens", "setBreakpoints"],
```

- **Why it matters:** The React/Styles section of the sidebar still shows "Mode" as the canonical name for the component that's now exported as `Theme`. Visitors see the old name in the navigation despite the underlying component being renamed.
- **Side:** Code (storybook config).
- **Benefit: 7/10** — affects every visitor's first encounter with the component story.
- **Complexity: 1/10** — one-character edit to `"Theme"`.

### 2. `storybook/src/components/Intro/Intro.tsx:19` — leaked prop

```tsx
<Icon mode="day" name="sun" … />
```

- **Why it matters:** `Icon`'s `mode` prop was renamed to `theme`. Most TS builds wouldn't error on a stray `mode` prop (it just gets ignored as an unknown HTML attr), so this silently does nothing instead of pinning the icon to day. Latent visual bug.
- **Side:** Code.
- **Benefit: 7/10** — silent runtime divergence in a visible component.
- **Complexity: 1/10** — change attribute name.

### 3. `storybook/stories/React/Components/Image/Mode.mdx`

```mdx
<Meta title="React/Components/Image/mode" />
# Image — Mode
… <Image mode="day" /> … <Image mode="night" /> …
```

- **Why it matters:** Demos the (now-renamed) prop. File name, meta title, and code examples all use the old vocabulary.
- **Side:** Code.
- **Benefit: 8/10** — canonical example for the renamed prop.
- **Complexity: 2/10** — `git mv Mode.mdx Theme.mdx`, rename meta title to `React/Components/Image/theme`, update heading and the two `<Image mode="…">` JSX call sites to `theme="…"`. Slug change breaks any deep links; in this repo such links live only in sibling MDX and are easy to grep.

### 4. `storybook/stories/React/Styles/Mode.mdx`

- **Why it matters:** This is the **canonical documentation** for the `<Mode>` (now `<Theme>`) component. Anyone reading the docs after the rename lands here and learns the wrong name.
- **Side:** Code.
- **Benefit: 9/10** — single source of truth; readers will see the new component but the doc page still names it Mode.
- **Complexity: 3/10** — `git mv Mode.mdx Theme.mdx`, rewrite `<Meta>`, heading, imports (`import { Theme }`), all prose mentions ("Pin a subtree to a specific design-system mode", "Inner Mode wrappers override outer ones", "component-level mode prop"), and the JSX examples. Update the cross-link from `1.2-Themes.mdx:55` which currently points at `/docs/react-styles-theme--docs` (assumes this rename is done — that link is dead until this is fixed).

### 5. `manifest/edit/component.md`

Multiple lines: 297, 454, 461, 467, 470, 480, 482, 484. Highlights:

- L297 `* Pin token resolution to a specific mode.` — JSDoc on a prop declaration in an example.
- L454 `do not pass mode into getToken(...) inside the styled-component`
- L461 `const Component: React.FC<Props> = ({ mode, …rest })` (destructure example)
- L467 `use a withMode local helper:`
- L470 `const withMode = (el: React.ReactElement) => mode ? <Mode name={mode}>{el}</Mode> : el`
- L480 `<Tile mode="night">`
- L484 `do not call getToken(name, variant, mode) with a third argument`

- **Why it matters:** This is the **canonical component-authoring doc**. The "wrap-in-Theme standard" section header is already renamed (tier-5 commit caught it), but the body code examples still demonstrate the old prop name. A new contributor reading this doc and copying the pattern would write `mode` on their new component.
- **Side:** Doc.
- **Benefit: 8/10** — guidance contradicts the API; defects propagate from copy-paste.
- **Complexity: 3/10** — find/replace within an MD file, but code examples need careful per-line edits (don't blindly s/mode/theme/ in surrounding prose because some refer to OS "dark mode" which stays).

### 6. `manifest/read/styles/tokens.md`

Multiple lines: 502, 507, 512, 526, 530-531, 536, 540. Highlights:

- L502 `– **"night"** replaces "dark" for mode suffixes throughout the system` — outdated since the rename
- L507 `### Pinning a region to a specific mode` — section heading
- L512 `/* …all mode vars */` — inline CSS comment in example
- L526 `### Component mode prop` — section heading
- L530-531 `Descendants of <Tile mode="night">`, `A child with its own mode prop pins itself`
- L536 `The third mode? argument on getToken(name, variant, mode)` — describes a parameter that no longer has this name
- L540 `Core type for mode props across the ecosystem`

- **Why it matters:** Same problem as #5. The two main manifest reference docs for tokens and components are the surfaces a future Claude instance (or a human contributor) reads to learn the system.
- **Side:** Doc.
- **Benefit: 8/10** — paired with #5, these two docs are the spec.
- **Complexity: 3/10** — same shape as #5.

### 7. `storybook/stories/Getting started/1.2-Themes.mdx`

- L20 `src="/rasters/dark-mode.png" alt="Dark mode"`
- L75 `If your user's OS or browser is set to dark mode`
- L79 `Most major React UI libraries treat dark mode as a single binary toggle`
- L92 `the design system matches whatever color mode the browser reports`

- **Why it matters:** Mixed bag. Most of these "dark mode" / "color mode" references are talking about the **OS/browser concept** — that is genuinely called "dark mode" in CSS spec language (`prefers-color-scheme: dark`) and should stay. The image filename and alt text are stylistic but visible.
- **Side:** Code.
- **Benefit: 4/10** — most of the content is correctly describing the OS-level dark-mode concept (not our API). Only the cosmetic asset path is mildly inconsistent.
- **Complexity: 2/10** — selective edits only. Rule: if it says "mode" referring to Nice's API → change; if it refers to the OS/browser feature → keep.

### 8. `storybook/stories/Getting started/3.2-Responsive.mdx:26`

```mdx
// mode
```

- A stray single-word comment in a code block. Almost certainly meant `// theme` or was a placeholder. Trivial.
- **Side:** Code.
- **Benefit: 3/10** — only a comment; no behavior impact.
- **Complexity: 1/10** — one-character change.

### 9. `dark-mode.png` raster filename + img src references

The hero image in `1.2-Themes.mdx` and possibly other places refers to `dark-mode.png`. Renaming the file to `dark-theme.png` (or `night-theme.png`) is symmetrically correct but cascades into every MDX/HTML/CSS that references the path, and breaks any external link to the asset.

- **Side:** Code.
- **Benefit: 2/10** — pure cosmetic.
- **Complexity: 3/10** — file rename + grep-and-replace src references. The blast radius is small but the benefit is smaller still.
- **Recommendation:** Skip for now. Address only if the rest of the cleanup creates a "complete the consistency" moment.

### 10. `react-button/src/components/Button/Button.tsx:38` — INTENTIONAL KEEP

```ts
// getInvertedMode(theme, status) was a no-op when status was defined (always
// returned the original theme). Button always passes status (default "primary"),
// so the call collapsed to passing theme through unchanged.
const invertedTheme = theme
```

- This comment documents the **inlining decision** when `getInvertedMode` was deleted. It intentionally names the deprecated function so future readers understand what was replaced and why.
- **Action: Keep verbatim.**

---

## Recommendation: which side changes

The asymmetry is clean:

- **Items 1-4** (storybook code) — code changes to match the renamed API.
- **Items 5-6** (manifest docs) — doc changes to match the renamed API.
- **Item 7** — selective code changes; the bulk of the prose is correctly describing OS-level concepts and should not be touched.
- **Items 8-9** — small code changes (or skip 9).
- **Item 10** — keep.

**There are no items where the manifest or code is "ahead" of the rename and the other side needs to catch up.** Every residual is a missed sweep, not a tension between intended designs. So in every case, **the residual gets dragged forward to match the new API/vocabulary**, never the other way around.

---

## Cross-cutting observations

1. **Story-file renames have an outsized blast radius despite being simple.** Mode.mdx (Styles) and Image/Mode.mdx are 2-3/10 complexity each, but they govern how every future visitor learns the component. They're the highest-leverage individual edits.

2. **The `1.2-Themes.mdx` cross-link to `/docs/react-styles-theme--docs` is currently dead** until item 4 is fixed. The slug-based link assumes the canonical Mode.mdx has already been renamed to Theme.mdx; right now Storybook routes that URL to nothing. Visible bug.

3. **The two manifest doc files (#5, #6) are the single highest source of "next contributor learns the old name" risk.** A new component author reading `edit/component.md` will copy the `mode={mode}` example into their new package and reintroduce the deprecated naming. Should be treated as a stop-the-bleeding fix even though no runtime is broken.

4. **No build-artifact staleness detected.** All `dist/` directories regenerated cleanly during the rename. The earlier hotfix (commit `4957ccc` for the `emitCoreTokens.ts { mode: }` option-key regression) was the only build-output bug; the consumer rebuild has since closed it.

5. **Prose "dark mode" language is legitimate.** Item 7 highlights this: the OS-level / CSS-spec concept *is* called "dark mode" and changing references to that meaning into "dark theme" would actually be wrong. The rename only applies to Nice's own API surface.

6. **Bump.md files in every package legitimately reference the old names** (they document the rename commit). Do not change.

---

## Suggested order

1. **Item 4** (Mode.mdx → Theme.mdx in React/Styles) — highest-leverage single edit; also unblocks the dead link from item 7.
2. **Item 3** (Image/Mode.mdx) — companion canonical example.
3. **Item 1** (storySort label) — visible in the sidebar to every visitor.
4. **Item 2** (Intro.tsx leaked prop) — silent runtime divergence.
5. **Items 5 + 6** (manifest docs) — together; both are spec surfaces.
6. **Item 7** — selective cleanup of `1.2-Themes.mdx`.
7. **Item 8** — trivial one-comment fix.
8. **Item 9** — skip / revisit later.
9. **Item 10** — leave as-is (intentional).

Items 1-4 are all storybook and could be batched into a single commit. Items 5-6 are all manifest and same. That gives a clean two-commit completion of everything except the optional cosmetic raster rename.

---

## What this audit does NOT cover

- The actual fixes themselves. Each item is described in enough detail to execute, but execution is for a follow-up pass.
- Renaming of the `dark-mode.png` raster (item 9), pending decision.
- Any decision about whether the `Mode.mdx` (Styles) story file rename should preserve a redirect for the old slug. Storybook has no built-in redirect mechanism; if external bookmarks need to survive, that's a separate concern.
- Session log entries in `.nice/sessions/` (intentionally historical — do not retroactively edit).