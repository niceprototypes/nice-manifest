# Backlog

Merged from the 2026-10-26 triage of `manifest/.reports/` (deleted; backup `~/nice/surveys/notes/reports-backup.tgz`, cited below as `bak:`). Paths are relative to `~/nice/`. Open owner questions: `~/nice/surveys/003-report-decisions.md` (cited as `S003 Qn`).

Dropped from the source tables: 67 DONE, 26 DEPRECATED, 24 COVERED by planned work. 93 OUTSTANDING rows deduped to 78; rows 79-80 come from this cleanup's manifest checks.

Phases, in order: pre-monorepo → monorepo → storybook-rework → components → manifest. Within a phase, rows are sorted by impact.

| id | item | evidence (file:line) | effort | package | phase |
|---|---|---|---|---|---|
| 1 | Owner instruction line cites `getCssConstant`; the API is `getConstant` / `getToken` (S003 Q1) | ~/.claude/CLAUDE.md:19; ~/AGENTS.md:19; styles/src/index.ts:52; react-styles/src/index.ts:40 | S | owner files | pre-monorepo |
| 2 | Publish backlog: no 2026-09/10 change is on npm; 17 packages never published. Ship as the first Changesets release (survey 002 step 7) | npm 404 for nice-react-{tabs,checkbox,toggle,dialog,select,calendar,field,popover}; npm nice-react-input 3.0.2 = local version with unpublished commits | M | all | monorepo |
| 3 | Peer-range drift on runtime singletons; set one bounded range (`>=19.2.0 <20`, `>=6.1.18 <7`) through the workspace | react-scroll/package.json:38,40 (`>=18`, `>=6.0.0`); unbounded `>=19.2.0` in react-button, react-icon, react-input, react-slider, react-tile | S | 6 packages | monorepo |
| 4 | Lift React-agnostic logic (setTokens, breakpoint `getCurrent`/subscribe, device detection) into nice-styles; react-styles re-exports, so no public break | react-styles/src/services/setTokens/index.ts:45-50; react-styles/src/services/withBreakpoints/useBreakpoint.ts:15; react-styles/src/components/StylesProvider/useDeviceDetection.ts:59 | M | styles, react-styles | monorepo |
| 5 | `@ts-expect-error` not type-checked under ts-jest; fix in the root test config | react-input/package.json:81 | S | test config | monorepo |
| 6 | react-tooltip declares unused `nice-icons` dep | react-tooltip/package.json:37,59 | S | react-tooltip | monorepo |
| 7 | App scaffold generator (`create`) for cold agents, as a workspace script after the umbrella package | toolkit/src/args/command.js:15 (no verb); recipe in manifest/agents/README.md §1 | M | monorepo tooling | monorepo |
| 8 | Remove app workarounds in nice-accountant / demo after publish (blocked by 2) | bak: .reports/nice-ui-hardening/plan.md:173-184 | S | external apps | monorepo |
| 9 | Deployed Storybook stale: 181 of 228 catalog story ids missing from the live index; redeploy after the rework | niceprototypes.com/ui/index.json vs manifest/agents/catalog.json | S | storybook | storybook-rework |
| 10 | Ink default `className="sb-unstyled"` puts a Storybook class in production markup; drop it, scope docs surfaces in Storybook | react-ink/src/components/Ink/Ink.tsx:43 | M | react-ink, storybook | storybook-rework |
| 11 | Theme load-flash leftovers: nav toggle never sets the explicit-theme flag (night lost on reload); theme mirrors rewrite `data-theme` with no diff check | storybook-navigation/src/components/StoryNavigation.tsx:244; storybook-spinner/src/scripts/themeResolverSource.ts:11; storybook/.storybook/preview.tsx:26; storybook-theme/src/manager.ts:35-37; styles/src/services/applyTheme.ts:19 | S | storybook-navigation, storybook-theme, styles | storybook-rework |
| 12 | Delete the 4 Lifecycle.mdx pages + LifecycleStory; Playground `play` tests replace them | manifest/edit/storybook.md:9 | S | storybook | storybook-rework |
| 13 | Storybook data plan remainder: TokenPreview groups beyond ZIndex; storySort and prev/next generated from the tree (inline marked block) | storybook/src/components/TokenPreview/; storybook/.storybook/preview.tsx:86; storybook/.storybook/storyNavigationSequences.ts | M | storybook | storybook-rework |
| 14 | Icons.mdx uses the root `nice-icons` import, which fails outside a bundler (see 21) | storybook/stories/Basics/Icons.mdx:55,76 | S | storybook | storybook-rework |
| 15 | Unknown icon `name` silently renders the `circle` fallback; add a dev warning | react-icon/src/components/Icon/Icon.tsx:121-122 (warn exists only for variants: resolveIconComponent.ts:30) | S | react-icon | components |
| 16 | Component colour tokens bypassed for defaults, so `setTokens({input/button/popover…})` has no effect on a default instance | react-input/src/components/Input/Input.styles.ts:21,23; react-button/src/components/Button/Button.styles.ts:126; react-popover/src/components/Popover/Popover.styles.ts:16 | M | styles, input, button, popover | components |
| 17 | Prop unions alias core types (`BorderColorType`…) instead of `TokenVariants["x.y"]`; props and token files drift with no tsc error (S003 Q2) | only react-styles/src/services/setTokens/setTokens.types.ts uses `TokenVariants[` | M | react-styles + all react-* | components |
| 18 | Missing icons for Data grid / AI chat / Header: play, more, eye/eye-off, share, refresh, cart, send, attachment, microphone, external-link, unlock (S003 Q5) | icons/src/icons/generated/*/base.svg (78 dirs; none of these) | M | icons | components |
| 19 | Lightbox overlay is not a modal dialog (no role=dialog, aria-modal, focus trap, focus return) | react-lightbox/src/components/Lightbox/Lightbox.tsx:50 (only `role="button"` on the trigger) | M | react-lightbox | components |
| 20 | Icon bundle 1.47 MB for 1 Button + Icon; ship a components-only nice-icons export + opt-in vendor registration (non-breaking, measured −67% JS) | react-icon/src/utilities/buildIconMap.ts:2; react-icon-vendor/src/services/resolveVendorIcon.ts:2 | M | icons, react-icon, react-icon-vendor | components |
| 21 | nice-icons root import fails outside a bundler (166 `.svg` imports); `getIconEncoded` loads the full base64 map. Split a no-SVG root entry; load per-icon JSON lazily | icons/src/index.js:19; icons/src/services/getIconEncoded.js:1 | M | icons | components |
| 22 | Global `prefers-reduced-motion` + reset P1 remainder (`text-wrap: pretty`, `:target { scroll-margin }`, `textarea:not([rows])` min-height) | only react-toggle/src/components/Toggle/Toggle.styles.ts has the query; none in styles/static/reset*.css | S | styles | components |
| 23 | Cascade layers: `@layer reset` + `@layer np.components`, so consumer CSS wins without specificity | 0 `@layer` in styles/static/reset*.css, styles/src, react-*/src | M | styles, all react-* | components |
| 24 | Tooltip: no `tooltip.json`, z-index `2147483647`, own `OFFSET = 8`, `nowrap` + max-width overflows | react-tooltip/src/components/Tooltip/Tooltip.styles.ts:23,25-26; Tooltip.tsx:10 | M | styles, react-tooltip | components |
| 25 | Tooltip trigger span not focusable; focus works only with a focusable child | react-tooltip/src/components/Tooltip/Tooltip.tsx:136 | S | react-tooltip | components |
| 26 | Off-screen slides stay in the a11y tree and tab order (no `inert`) | react-slider/src/components/Slider/Slider.tsx | S | react-slider | components |
| 27 | Code `copyOnClick` `<div>` not keyboard operable; no focus-visible style | react-code/src/components/Code/Code.tsx; Code.styles.ts | S | react-code | components |
| 28 | Icon: no `aria-hidden` default, no `aria-label` prop | react-icon/src/components/Icon/Icon.tsx | S | react-icon | components |
| 29 | Input `status="error"` does not set `aria-invalid` (only Field `invalid` does) | react-input/src/components/Input/Input.tsx:124 | S | react-input | components |
| 30 | Tabs: no `ref`; `tabpanel` lacks `tabIndex={0}` | react-tabs/src/components/Tabs/Tabs.types.ts; Tabs.tsx | S | react-tabs | components |
| 31 | Lightbox literals (backdrop `rgba(0,0,0,0.9)`, caption padding, max sizes, zIndex 9999); add an overlay/scrim colour token | react-lightbox/src/components/Lightbox/Lightbox.styles.ts:24,29,30; LightboxCaption.styles.ts:4-5; styles/src/tokens/components/lightbox.json:3 | S | styles, react-lightbox | components |
| 32 | Scroll literals: z-index 100, `0.3s ease-in-out`, `0.1s linear` (tokens exist) | react-scroll/src/components/Sticky/Sticky.styles.ts:9,11; FadeOnScroll.styles.ts:5 | S | react-scroll | components |
| 33 | Input transition literal `0.15s ease-in-out` | react-input/src/components/Input/Input.styles.ts:181-183 | S | react-input | components |
| 34 | Code literals (1px border, 720px, 5em, label shadow) | react-code/src/components/Code/Code.styles.ts:19,22,73; CodeLabel.styles.ts:19 | S | styles, react-code | components |
| 35 | Toggle `transitionDuration` naming + literal `ease-out` | styles/src/tokens/components/toggle.json:40; react-toggle/src/components/Toggle/Toggle.styles.ts:51,63 | S | styles, react-toggle | components |
| 36 | Logo: `gap` literal px prop (token unread); `logo.height` unitless × 1px | react-logo/src/components/Logo/Logo.tsx:27; Logo.styles.ts:16; styles/src/tokens/components/logo.json:3,6 | S | styles, react-logo | components |
| 37 | Hover/`:active` states missing on checkbox, toggle, calendar, list | 0 `:hover` in those packages' styles | M | styles + 4 packages | components |
| 38 | Button has no brand/primary tone (S003 Q4) | react-button/src/components/Button/Button.types.ts:139 | M | styles, react-button | components |
| 39 | Registered variants (e.g. `gap.jumbo`) cannot pass through Flex/Ink props; fontSize and other scales stop at `larger` (no display tier) | styles/src/tokens/modules/fontSize.json; Flex/Ink props typed `GapType`/`FontSizeType` | L | react-styles, flex, ink, styles | components |
| 40 | Ink `as` widening (`a`, `li`, `h5/h6`, `blockquote`, `cite`, `mark`, `s`) + `href`, `decoration`, `truncate` | react-ink/src/components/Ink/Ink.types.ts:28 | S | react-ink | components |
| 41 | Number entry: Input `min`/`max`/`step` + NumberField stepper (S003 Q3) | react-input/src/components/Input/Input.types.ts (no props) | M | react-input / new | components |
| 42 | Editable Combobox (filtering, IME-safe) (S003 Q3) | react-select/src/components/Select/Select.types.ts:15-16 | L | new | components |
| 43 | DateField typed entry, clear, range, `required` (S003 Q3) | react-calendar/src/components/DateField/DateField.types.ts:27 | L | react-calendar | components |
| 44 | Container / page-width primitive (S003 Q3) | no package | M | new or Flex props | components |
| 45 | Divider (Line is a frame) (S003 Q3) | no package | S | new | components |
| 46 | Stat / KPI block (S003 Q3) | no package | S | new | components |
| 47 | Timer (role=timer, milestone live region, `endAt` clock) from the prototype (S003 Q3) | bak: .reports/timer/demo-source/Timer.stories.tsx | M | new | components |
| 48 | Token naming pass: `generateTokenCSS`/`injectTokenCSS` casing, `getConstant` name, `modeNotFound` key (S003 Q2) | styles/src/services/index.ts:81,85; styles/src/services/getConstant.ts:78; styles/src/services/getToken.ts:134 | M | styles, react-styles | components |
| 49 | Inline padding named 3 ways (`spacing` vs `padding`) (S003 Q2) | styles/src/tokens/components/button.json:9; input.json:9; tabs.json:2; list.json:2 | M | styles, button, input | components |
| 50 | `getToken` theme pin on a component alias with no theme layer throws (no repro yet) | styles/src/services/getToken.ts:130-136 | M | styles | components |
| 51 | No `forced-colors` handling | 0 hits in styles/src, react-*/src | M | styles + drawn controls | components |
| 52 | Validation timing: late default, `:user-invalid` | 0 `user-invalid` in react-field/src | M | react-field | components |
| 53 | Select `appearance: base-select` progressive enhancement | 0 `base-select` in react-select/src | M | react-select | components |
| 54 | Calendar: no `focusRing` / `borderWidth` / `borderRadius` tokens | styles/src/tokens/components/calendar.json | S | styles, react-calendar | components |
| 55 | Calendar/DateField aria-labels hard-coded in English | react-calendar/src/components/Calendar/Calendar.tsx:244,254; DateField.tsx:13 | S | react-calendar | components |
| 56 | No core disabled-opacity token; literal 0.5 in 3 files | styles/src/tokens/components/checkbox.json:57-58 | S | styles | components |
| 57 | `theme` prop missing on Code, Lightbox, Slider, Tooltip, Flex, Scroll | their `*.types.ts` (0 `theme`) | S | 6 packages | components |
| 58 | `sensitive` prop (session-replay redaction markers) | 0 hits in react-input/src, react-field/src | S | react-field, react-input | components |
| 59 | Encoded icon theme `"base"\|"night"` vs `ThemeType` `"day"\|"night"`; accept `day`, keep `base` as alias | icons/src/services/getIconEncoded.d.ts:14 | S | icons | components |
| 60 | react-flex calls `getConstant` (no registry validation) instead of `getToken` | react-flex/src/services/styleFlex.ts:1,62 | S | react-flex | components |
| 61 | react-button builds `--np--button--height` var string by hand | react-button/src/components/Button/Button.styles.ts:102,107,127 | S | react-button | components |
| 62 | Line `rimColor` literal white, no night value | styles/src/tokens/components/line.json:14 | S | styles | components |
| 63 | No `@media print` theme handling | 0 hits in styles/src, styles/static, styles/scripts | S | styles | components |
| 64 | Ink `letterSpacing` / `maxWidth` tokens have no prop or reader | styles/src/tokens/components/ink.json:29,47 | S | styles, react-ink | components |
| 65 | Unused tokens: `icon.viewBox`, `image.objectFit`, `code.fontWeight` | react-icon/.../Icon.tsx:38; Illustration.tsx:28; styles/src/tokens/components/image.json:37; code.json:27 | S | styles, icon, image, code | components |
| 66 | Input types used bare (`SizeType`, `BorderWidthType`, `ThemeType`) | react-input/src/components/Input/Input.types.ts:600,612,615 | S | react-input | components |
| 67 | Form root is raw flex CSS, not Flex; no gap | react-form/src/components/Form/Form.styles.ts:13-15 | S | react-form | components |
| 68 | List `variant="plain"` (bullets/checklist) | react-list/src/components/List/List.types.ts | S | react-list | components |
| 69 | Popover offset doc says aliases are not resolved; `getToken` now follows them | react-popover/src/utilities/getPopoverOffset.ts:16-19 vs styles/src/services/getToken.ts:231-272 | S | react-popover | components |
| 70 | Icon: 4 duplicated `IconWrapperStyled` render branches | react-icon/src/components/Icon/Icon.tsx | S | react-icon | components |
| 71 | `e` → `event` param naming | react-lightbox/.../LightboxCaption.tsx:14; Lightbox.tsx:34,62; react-styles/.../ThemeContext.tsx:68 | S | react-lightbox, react-styles | components |
| 72 | react-flex README documents the deprecated object `spacing` API (~120 lines; wrong examples, token waste) | react-flex/README.md:115-120,140-236 | S | react-flex | manifest |
| 73 | Catalog regenerates by hand and goes stale; run the generator on build | manifest/agents/scripts/generate-catalog.mjs (not in any build script) | S | manifest | manifest |
| 74 | Catalog leaves imported type aliases unresolved (`SizeType`, `FlexSpacingType`; 11 strings) | manifest/agents/catalog.json | M | manifest | manifest |
| 75 | icons README: `getIcon("check", {color,size})` passes options in the `variant` slot; no encoded/base64 docs | icons/README.md:14 vs icons/src/services/getIcon.d.ts:25 | S | icons | manifest |
| 76 | 7 READMEs call breakpoints an "array" and link a non-existent `withbreakpoints--docs` page | react-{code,button,flex,image,ink,lightbox,slider}/README.md | S | READMEs | manifest |
| 77 | README stubs / missing: ink 5 lines, image 3, lightbox 7, code 7; none for react-input, react-head, react-image-vendor. Make each a minimal pointer to Playground + catalog | those README.md files | S | READMEs | manifest |
| 78 | README `## License` missing (24 packages); `## Install` vs `## Installation` (15); react-flex title | e.g. react-checkbox/README.md; react-flex/README.md:1 | S | READMEs | manifest |
| 79 | Dead refs to `manifest/.nice/reports/*` (never existed) | manifest/README.md:155; build/symlinks.md:35,96; topics/build-config.md:272; edit/component.md:729 | S | manifest | manifest |
| 80 | Reports convention still routes reports to `manifest/.reports/` (folder deleted) | manifest/README.md:222-250; read/audit.md:31,79; .gitignore:4 | S | manifest | manifest |

## Facts to keep

- **Load flash:** caused by several theme writers. tokens.css follows `prefers-color-scheme` until JS sets `data-theme` (C1); the preview iframe paints white before its CSS (C2); the dark-mode tool applies `prefersDark` before parameters load, then forces light (C3); the nav toggle drops the explicit flag (C4). Not a `@layer` issue. Fix: pre-seed `data-theme` in the head before CSS; the overlay masks the rest.
- **Storybook head injection:** `managerHead` is evaluated once at server start (restart to change); `previewHead` per request. One addon preset can inject into both.
- **storySort must be inline** in `preview.tsx` (csf-tools static parse). Generate into a marked block; never import it.
- **Storybook id rule:** lowercase the path, each non-alphanumeric run → `-`; id = title path + `--docs` / `--{story}`.
- **Token prefix:** length/content has zero runtime cost; a custom prefix is safe; no prefix risks collisions with third-party/UA CSS; build-time only.
- **Token comparables:** Panda/Chakra are closest to getToken + registry (dictionary with per-condition entries, list/search API). No surveyed system has a seed/runtime layered store; Tamagui is the closest emission analogue. Patterns: one ordered breakpoint source (Polaris); shared line builders for build and runtime (Terrazzo/Polaris); one normalized model read once (SD/Terrazzo); generated header from one constant (SD).
- **Reset philosophy:** Comeau/Bell modern-sensible reset, token-driven. Reject Preflight and `all: unset`; Nice ships typography defaults.
- **Figma vs Storybook:** Figma's WASM heap has a 2 GB per-tab limit, grows but never shrinks, and loads a library per consuming file. Storybook docs execute the artifact, so drift throws. Executed docs cannot drift; transcribed docs can.
- **Agent guess-points:** Button `status` is `base|disabled|error|success|warning` (no `primary`). `setTokens` returns a typed `getToken`. `{phone,"laptop+"}` leaves tablet undefined; use `phone+`. Lucide needs the side-effect `import "nice-react-icon-vendor"`. StylesProvider does not load reset.css.
- **Spinner SSR:** nice-react-icon and react-styles dists are `"type":"module"` with a CJS `main` and a `.css` import; Node imports need esbuild `--main-fields=module,main --loader:.css=empty`.
- **Timer a11y/timing:** `role="timer"` (aria-live off) + a separate polite live region for milestones; WCAG 2.2.1 requires pause/extend; derive remaining time from `endAt`, never decrement; recalculate on `visibilitychange`; colour stops as one `[{at,color}]` array.
- **Proton SDK:** API is CORS-blocked; needs Node with `--conditions=browser`, `@protontech/crypto/polyfill`, `x-pm-appversion: web-drive@5.0.0`. CAPTCHA/HV (9001) blocks headless login.
