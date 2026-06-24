# Unpinned Color-Token Audit — website + storybook

**Date:** 2026-05-18
**Scope:** Every call site in `website/src/` and `storybook/{src,stories}/` that resolves a mode-aware token *without specifying a mode argument*. These call sites auto-sync to the browser's `prefers-color-scheme` setting and will need to be pinned wherever a fixed appearance is required (e.g. the website Home/Hero must be day-locked).

## Why this exists

After auto dark mode landed in `nice-styles@10.0.0` (the merge of `color-scheme.css` into `variables.css`), the *semantic* CSS variable for every mode-aware token — `--np--foreground-color`, `--np--background-color`, etc. — reassigns itself to the night primitive under `@media (prefers-color-scheme: dark)`. Any reference to the semantic variable, including via `getToken("foregroundColor", "base")`, follows that switch.

To pin a value, pass an explicit mode as the third argument:

| Form | Resolves to |
|---|---|
| `getToken("foregroundColor", "base")` | semantic var — auto-syncs with browser |
| `getToken("foregroundColor", "base", "day")` | day primitive — locked, never reassigns |
| `getToken("foregroundColor", "base", "night")` | night primitive — locked, never reassigns |
| `getToken("foregroundColor", "base", $mode)` | prop-controlled — pinned per component |

`getModeToken(...)` is *already* day-pinned by default — its mode argument defaults to `"day"` — so calls to it are not in this list.

## Color-bearing token groups in scope

| Group | Source |
|---|---|
| `foregroundColor` | `nice-styles` core (`module.color.json`) |
| `backgroundColor` | `nice-styles` core |
| `borderColor` | `nice-styles` core |
| `brandColor` | `website/src/nice/tokens.ts` (custom mode-aware) |
| `projectColor` | `website/src/nice/tokens.ts` (custom mode-aware) |
| `tileBackgroundColor` | `website/src/nice/tokens.ts` (custom mode-aware) |
| `tileForegroundColor` | `website/src/nice/tokens.ts` (custom mode-aware; currently empty) |

The `gradient` group (also custom in website) has mode-aware `day`/`night` variants but the call site in `Home/Hero/Hero.tsx:44` uses the static `brand` variant — not mode-aware. Not flagged.

## Already pinned — 11 instances, left out of this list

| Where | How |
|---|---|
| `website/src/nice/tokens.ts:56` | Literal `"night"` (inside the `gradient.night` definition) |
| `website/src/nice/Menu/Menu.styles.ts:33,35,38,41` | `$mode` prop-controlled |
| `website/src/components/Footer/Footer.tsx:16` and `Footer.styles.ts:13` | Literal `"night"` |
| `website/src/components/FramedImage/FramedImage.styles.ts:11` | `$mode` prop-controlled |
| `website/src/pages/Home/PledgeGraphic/LogoFillIcon/LogoFillIcon.styles.ts:45` | Literal `"night"` |
| `storybook/src/components/DocsRow/DocsRow.styles.ts:68` | Literal `"night"` (intentional contrast in a docs cell) |
| `storybook/stories/Tokens/Styles/Styles.mdx:49` | Literal `"day"` (demo pin) |

## Note on Home/Hero specifically

`website/src/pages/Home/Hero/Hero.tsx` only calls `getToken("gradient", "brand")`, which is a static value. Hero's own code is already mode-safe. The auto-syncing observed on Home/Hero is being inherited from child components (Typography, Tile, etc.) whose internal styles use unpinned semantic vars. Those internals live in `nice-react-typography` / `nice-react-tile` / etc. — outside the scope of this audit.

---

# Unpinned call sites — 101 total

## website (28)

```
website/src/components/Header/Header.styles.ts:29:    stroke: ${getToken("foregroundColor", "base")};
website/src/components/Header/Header.styles.ts:37:      stroke: ${getToken("foregroundColor", "lighter")};
website/src/components/Header/Header.styles.ts:42:        stroke: ${getToken("foregroundColor", "base")};
website/src/components/Navigation/Navigation.styles.ts:33:      color: ${getToken("foregroundColor", "lighter")};
website/src/components/Navigation/Navigation.styles.ts:36:        color: ${getToken("foregroundColor", "base")};
website/src/pages/Home/Skills/Skills.tsx:31:            accentColor={getToken("brandColor", "primary")}
website/src/pages/Home/Skills/Skills.tsx:38:            accentColor={getToken("brandColor", "secondary")}
website/src/pages/Home/Skills/Skills.tsx:45:            accentColor={getToken("brandColor", "tertiary")}
website/src/pages/Home/Tool/Tool.styles.ts:10:      stroke: ${getToken("foregroundColor", "lighter")};
website/src/pages/Home/UI/UI.tsx:33:          color: getToken("brandColor", "mint"),
website/src/pages/Home/UI/UI.tsx:57:              color: getToken("brandColor", "mint"),
website/src/pages/Home/UI/UI.tsx:73:              color: getToken("brandColor", "mint"),
website/src/pages/ProjectHelpShelf/Metrics/Metrics.styles.ts:22:    ${getToken("borderColor", "base")};
website/src/pages/ProjectHelpShelf/Metrics/Metrics.tsx:18:      color: getToken("projectColor", "helpshelfPrimary"),
website/src/pages/ProjectHelpShelf/Metrics/Metrics.tsx:24:      color: getToken("projectColor", "helpshelfSecondary"),
website/src/pages/ProjectHelpShelf/Metrics/Metrics.tsx:30:      color: getToken("projectColor", "helpshelfTertiary"),
website/src/pages/ProjectHelpShelf/Metrics/Metrics.tsx:36:      color: getToken("projectColor", "helpshelfQuaternary"),
website/src/pages/ProjectHelpShelf/Metrics/MetricsChart.tsx:27:                fill={getToken("projectColor", "helpshelfPrimary")}
website/src/pages/ProjectHelpShelf/Metrics/MetricsChart.tsx:33:                fill={getToken("projectColor", "helpshelfSecondary")}
website/src/pages/ProjectHelpShelf/Metrics/MetricsChart.tsx:39:                fill={getToken("projectColor", "helpshelfTertiary")}
website/src/pages/ProjectHelpShelf/Metrics/MetricsChart.tsx:45:                fill={getToken("projectColor", "helpshelfQuaternary")}
website/src/pages/ProjectHelpShelf/Principles/Principles.tsx:36:              getToken("tileBackgroundColor", "gold"),
website/src/pages/ProjectHelpShelf/Principles/Principles.tsx:37:              getToken("tileBackgroundColor", "silver"),
website/src/pages/ProjectHelpShelf/Principles/Principles.tsx:38:              getToken("tileBackgroundColor", "bronze"),
website/src/pages/ProjectHelpShelf/ProjectHelpShelf.tsx:162:        iconColor={getToken("tileBackgroundColor", "silver")}
website/src/pages/ProjectHelpShelf/ProjectHelpShelf.tsx:213:        iconColor={getToken("tileBackgroundColor", "bronze")}
website/src/pages/ProjectHelpShelf/ProjectHelpShelf.tsx:50:        iconColor={getToken("tileBackgroundColor", "gold")}
website/src/pages/ProjectHelpShelf/VideoDiv/VideoDiv.styles.ts:11:  border: 2px solid ${() => getToken("borderColor", "base")};
```

## storybook/src (4)

```
storybook/src/components/DemoDots/DemoDots.tsx:34:            border: `${getToken("borderWidth")} solid ${getToken("borderColor")}`,
storybook/src/components/DocsRow/DocsRow.styles.ts:15:    border-bottom: 1px solid ${getToken("borderColor", "base")};
storybook/src/components/DocsRow/DocsRow.styles.ts:28:    border-top: 1px solid ${getToken("borderColor")};
storybook/src/components/DocsRow/DocsRow.styles.ts:58:      border: 1px solid ${getToken("borderColor")};
storybook/src/components/DocsRow/DocsRow.styles.ts:62:        border-color: ${getToken("borderColor", "darker")};
storybook/src/components/DocsRow/DocsRow.styles.ts:67:        background-color: ${getToken("borderColor", "darker")} !important;
storybook/src/nice/Typography/Typography.styles.ts:7:    color: ${getToken("foregroundColor", "link")};
```

## storybook/stories (56)

```
storybook/stories/Getting started/2.1-Simple.mdx:32:  background: ${getToken("backgroundColor", "alternate")};
storybook/stories/Getting started/3.3-Custom-fonts.mdx:41:getToken("brandColor", "primary") // var(--np--brand-color--primary) → #dc0000
storybook/stories/React/Components/Flex/AlignItems.mdx:12:    color: getToken("foregroundColor", "error"),
storybook/stories/React/Components/Flex/AlignItems.mdx:17:    color: getToken("foregroundColor", "warning"),
storybook/stories/React/Components/Flex/AlignItems.mdx:22:    color: getToken("foregroundColor", "link"),
storybook/stories/React/Components/Flex/AlignItems.mdx:30:    color: getToken("foregroundColor", "error"),
storybook/stories/React/Components/Flex/AlignItems.mdx:34:    color: getToken("foregroundColor", "warning"),
storybook/stories/React/Components/Flex/AlignItems.mdx:38:    color: getToken("foregroundColor", "link"),
storybook/stories/React/Components/Flex/Flex.services.ts:10:    color: getToken("foregroundColor", "warning"),
storybook/stories/React/Components/Flex/Flex.services.ts:19:    color: getToken("foregroundColor", "link"),
storybook/stories/React/Components/Flex/Flex.services.ts:5:    color: getToken("foregroundColor", "error"),
storybook/stories/React/Components/Flex/Grow.mdx:25:          color: getToken("foregroundColor", "error"),
storybook/stories/React/Components/Flex/Grow.mdx:31:          color: getToken("foregroundColor", "link"),
storybook/stories/React/Components/Flex/Grow.mdx:49:          color: getToken("foregroundColor", "error"),
storybook/stories/React/Components/Flex/Grow.mdx:54:          color: getToken("foregroundColor", "link"),
storybook/stories/React/Components/Flex/Grow.mdx:72:          color: getToken("foregroundColor", "error"),
storybook/stories/React/Components/Flex/Grow.mdx:77:          color: getToken("foregroundColor", "link"),
storybook/stories/React/Components/Flex/Type.mdx:25:              border: `${getToken("borderWidth")} solid ${value === "margin" ? getToken("borderColor") : getToken("borderColor", "dark")}`,
storybook/stories/React/Components/Flex/Type.mdx:32:                border: `${getToken("borderWidth")} solid ${value === "margin" ? getToken("borderColor", "dark") : "transparent"}`,
storybook/stories/React/Components/Flex/Wrap.mdx:11:    color: getToken("foregroundColor", "error"),
storybook/stories/React/Components/Flex/Wrap.mdx:16:    color: getToken("foregroundColor", "warning"),
storybook/stories/React/Components/Flex/Wrap.mdx:21:    color: getToken("foregroundColor", "link"),
storybook/stories/React/Components/Flex/Wrap.mdx:26:    color: getToken("foregroundColor", "success"),
storybook/stories/React/Components/Flex/Wrap.mdx:31:    color: getToken("foregroundColor", "disabled"),
storybook/stories/React/Components/Scroll/stories/StickyOrder.story.tsx:28:                  backgroundColor: getToken("foregroundColor", "error"),
storybook/stories/React/Components/Scroll/stories/StickyOrder.story.tsx:42:                  backgroundColor: getToken("foregroundColor", "warning"),
storybook/stories/React/Components/Slider/Slider.services.tsx:42:    { title: "Slide 1", color: getToken("foregroundColor", "error") },
storybook/stories/React/Components/Slider/Slider.services.tsx:43:    { title: "Slide 2", color: getToken("foregroundColor", "warning") },
storybook/stories/React/Components/Slider/Slider.services.tsx:44:    { title: "Slide 3", color: getToken("foregroundColor", "success") },
storybook/stories/Tokens/Styles/Styles.mdx:115:            backgroundColor: getToken("backgroundColor", variant),
storybook/stories/Tokens/Styles/Styles.mdx:118:            border: `${getToken("borderWidth")} solid ${getToken("borderColor")}`,
storybook/stories/Tokens/Styles/Styles.mdx:124:      code={`getToken("backgroundColor", "${variant}")`}
storybook/stories/Tokens/Styles/Styles.mdx:140:            border: `${getToken("borderWidth")} solid ${getToken("borderColor", variant)}`,
storybook/stories/Tokens/Styles/Styles.mdx:146:      code={`getToken("borderColor", "${variant}")`}
storybook/stories/Tokens/Styles/Styles.mdx:162:            border: `${getToken("borderWidth")} solid ${getToken("foregroundColor", "light")}`,
storybook/stories/Tokens/Styles/Styles.mdx:182:            border: `${getToken("borderWidth", variant)} solid ${getToken("foregroundColor", "light")}`,
storybook/stories/Tokens/Styles/Styles.mdx:202:            backgroundColor: getToken("backgroundColor", "dark"),
storybook/stories/Tokens/Styles/Styles.mdx:208:              backgroundColor: getToken("backgroundColor"),
storybook/stories/Tokens/Styles/Styles.mdx:233:            border: `${getToken("borderWidth")} solid ${getToken("foregroundColor", "light")}`,
storybook/stories/Tokens/Styles/Styles.mdx:321:            backgroundColor: getToken("foregroundColor", variant),
storybook/stories/Tokens/Styles/Styles.mdx:327:      code={`getToken("foregroundColor", "${variant}")`}
storybook/stories/Tokens/Styles/Styles.mdx:342:              color: getToken("foregroundColor", "error"),
storybook/stories/Tokens/Styles/Styles.mdx:347:              color: getToken("foregroundColor", "link"),
storybook/stories/Tokens/Styles/Styles.mdx:36:    { name: "base", backgroundColor: getToken("foregroundColor", "error") },
storybook/stories/Tokens/Styles/Styles.mdx:39:      backgroundColor: getToken("foregroundColor", "warning"),
storybook/stories/Tokens/Styles/Styles.mdx:81:            backgroundColor: getToken("backgroundColor", "dark"),
storybook/stories/Tokens/Styles/Styles.mdx:94:              stroke={getToken("foregroundColor", "lighter")}
storybook/stories/Tokens/Styles/animationDuration.mdx:15:    { name: "base", backgroundColor: getToken("foregroundColor", "error") },
storybook/stories/Tokens/Styles/animationDuration.mdx:18:      backgroundColor: getToken("foregroundColor", "warning"),
storybook/stories/Tokens/Styles/animationDuration.mdx:28:              backgroundColor: getToken("backgroundColor", "dark"),
storybook/stories/Tokens/Styles/animationEasing.mdx:19:            backgroundColor: getToken("backgroundColor", "dark"),
storybook/stories/Tokens/Styles/animationEasing.mdx:32:              stroke={getToken("foregroundColor", "lighter")}
storybook/stories/Tokens/Styles/backgroundColor.mdx:21:            backgroundColor: getToken("backgroundColor", variant),
storybook/stories/Tokens/Styles/backgroundColor.mdx:24:            border: `${getToken("borderWidth")} solid ${getToken("borderColor")}`,
storybook/stories/Tokens/Styles/backgroundColor.mdx:30:      code={`getToken("backgroundColor", "${variant}")`}
storybook/stories/Tokens/Styles/borderColor.mdx:22:            border: `${getToken("borderWidth")} solid ${getToken("borderColor", variant)}`,
storybook/stories/Tokens/Styles/borderColor.mdx:28:      code={`getToken("borderColor", "${variant}")`}
storybook/stories/Tokens/Styles/borderRadius.mdx:24:            border: `${getToken("borderWidth")} solid ${getToken("foregroundColor", "light")}`,
storybook/stories/Tokens/Styles/borderWidth.mdx:21:            border: `${getToken("borderWidth", variant)} solid ${getToken("foregroundColor", "light")}`,
storybook/stories/Tokens/Styles/boxShadow.mdx:20:            backgroundColor: getToken("backgroundColor", "dark"),
storybook/stories/Tokens/Styles/boxShadow.mdx:26:              backgroundColor: getToken("backgroundColor"),
storybook/stories/Tokens/Styles/cellHeight.mdx:23:            border: `${getToken("borderWidth")} solid ${getToken("foregroundColor", "light")}`,
storybook/stories/Tokens/Styles/foregroundColor.mdx:34:            backgroundColor: getToken("foregroundColor", variant),
storybook/stories/Tokens/Styles/foregroundColor.mdx:40:      code={`getToken("foregroundColor", "${variant}")`}
storybook/stories/Tokens/Styles/gap.mdx:23:              color: getToken("foregroundColor", "error"),
storybook/stories/Tokens/Styles/gap.mdx:28:              color: getToken("foregroundColor", "link"),
```
