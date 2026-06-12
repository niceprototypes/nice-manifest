# KPI — Where Nice Saves Teams the Most Repetitive Work

**What this is:** a plain-language ranking of the advantages a team gets from
Nice UI versus the four most popular alternatives, ordered by how much tedious,
recurring work each advantage removes from design and engineering. Written for a
non-technical reader — no code, every term explained.

**Who it's compared against** (the same set as the Welcome → Why page):
Material UI, Ant Design, Chakra UI, and Radix.

**How honest this is:** the "what Nice does" claims are verified against Nice's
own implementation. The "what the alternatives require" claims are verified
against each competitor's official 2025–2026 documentation (sources at the end).
Where a competitor is genuinely just as good as Nice, this report says so —
the goal is an accurate map, not a sales sheet.

**Date:** 2026-06-01.

---

## First, five terms in plain English

You only need these five ideas to read the rest.

- **Design token.** A named design decision — "base text size," "brand color,"
  "standard corner roundness." Instead of scattering the number `16px` across
  hundreds of files, everyone references the token "base text size." Change it
  once, it changes everywhere.

- **CSS variable.** The web browser's *own* built-in version of a token. Because
  the browser understands it natively, it can be seen and tweaked directly in
  the browser's inspector, and it can change instantly (e.g. light → dark)
  without the app rebuilding itself.

- **Done in JavaScript vs. done in plain CSS.** Some systems compute their
  styling with extra program code *while the page is running* (slower, heavier,
  harder to inspect). Others express it as plain CSS the browser handles itself
  (lighter, faster, inspectable). This distinction drives a lot of the
  differences below.

- **"Opt-in."** A capability that exists but is *off by default* — the team has
  to deliberately turn it on, and learn how. Off-by-default features quietly
  become "things we never got around to."

- **"Per-component / per-screen work."** Work that has to be repeated for every
  new component or screen, forever, rather than solved once centrally. This is
  the tedium that compounds as a product grows — and the thing this report
  measures.

---

## The one-sentence finding

Most of these systems *can* do most of these things — but each one makes you
turn something on, install something extra, write bookkeeping code, repeat work
per screen, or accept a hard limit. **Nice's real advantage is that it does the
whole set in one small system, on by default, with none of those taxes.** The
win is removed busywork, not raw capability.

---

## The ranking (most impactful first)

Ranked by two things together: **how much repetitive work the advantage removes**,
and **how far ahead of the four alternatives Nice actually is** on it.

---

### 1. Change the system's design values *and* add your own — in the same place

**The grind it removes:** Every product needs its own brand — its colors, its
type, plus values the base system never imagined ("a third shade of background,"
"a marketing-gradient"). The recurring pain is keeping "the design system's
values" and "our custom values" as two separate, drifting sources of truth.

**What Nice does:** One instruction both overrides the built-in values *and*
adds brand-new ones, and everything is then used the exact same way. There is no
"our tokens live somewhere else." It's one vocabulary.

**What the alternatives require (verified):**
- **Ant Design — not possible.** You can re-tint Ant's *existing* values, but
  the maintainers **explicitly declined** to let teams add their own custom
  tokens into the system (a feature request closed as "not planned"). Teams that
  need custom tokens must run a **second, parallel system** alongside Ant. This
  is a real, lasting tax.
- **Material UI — possible, but taxed.** You can add custom values in one config
  file, but for *each* custom value you must also write a small piece of
  bookkeeping code so the tooling recognizes it. Easy to forget, must be kept in
  sync.
- **Chakra / Radix Themes — comparable to Nice.** Both let you override and add
  in one configuration. Credit where due.

**Why it matters to you:** branding a product on Ant means maintaining two
systems forever; on MUI it means ongoing bookkeeping. On Nice (and Chakra) it's
one place. Against the most "enterprise" options, this is one of Nice's clearest
wins.

---

### 2. Dark mode is defined once — and your *own* components follow automatically

**The grind it removes:** Dark mode is the task teams dread most, because the
naïve way to build it is to hand-pick a dark color for every element on every
screen — then maintain two of everything forever.

**What Nice does:** Light and dark are defined **once, at the values layer**.
Every component that uses those values — including the team's own custom
components — automatically looks correct in both modes. No second set of
screens, no extra library to install, and no special script to prevent the
"flash of the wrong theme" when a page first loads (the default simply follows
the user's device setting).

**What the alternatives require (verified):**
- **Material UI & Ant Design — easy for *their* parts, manual for *yours*.**
  Turning on dark mode for the built-in components is essentially one switch —
  the library recolors itself. But your *custom* components don't come along
  automatically; a developer has to specify their dark appearance case by case.
- **Chakra & Radix Themes — comparable to Nice.** Both also define dark at the
  values layer, so custom components that use those values adapt for free. One
  small edge for Nice: Chakra's newest version offloads the actual light/dark
  switch to a **separate third-party library** you must add and wire up; Nice
  needs no extra library.

**Why it matters to you:** against MUI and Ant, Nice turns "dark mode for the
whole product, custom screens included" from an ongoing per-screen project into
something that's simply already done. Against Chakra/Radix it's a wash, minus a
little less plumbing.

---

### 3. The design values are real, inspectable CSS variables — by default

**The grind it removes:** When design values are locked inside program code,
designers and QA can't see or adjust them in the browser, third-party widgets
dropped into the product don't match, and switching themes makes the whole app
recompute itself (slower, with visible flicker).

**What Nice does:** Every value is a standard browser CSS variable out of the
box. That means: designers/QA can inspect and tweak the exact value live in the
browser; raw HTML and outside widgets placed inside a Nice screen automatically
inherit the look; and switching light/dark or screen sizes is handled by the
**browser's own CSS**, not by extra program code running as the page renders.

**What the alternatives require (verified):**
- **Material UI & Ant Design — off by default.** Both *can* expose their values
  as real CSS variables, but it's an **opt-in mode** you must deliberately
  enable. Left at the default, their values are computed in program code while
  the page runs — heavier, and not directly inspectable.
- **Chakra — comparable to Nice** (real CSS variables, on by default; this is
  one of its signature traits).
- **Radix Themes — comparable** for its color system (a full set of
  CSS-variable color scales, including transparency and high-end-display color).

**Why it matters to you:** this is the foundation that makes dark mode, theming,
and responsiveness cheap rather than expensive. Nice matches the best
(Chakra/Radix) here and is ahead of MUI/Ant's defaults.

---

### 4. Text and spacing resize themselves by screen — from the values, not screen by screen

**The grind it removes:** Making a product feel right on a phone, a tablet, and a
large monitor normally means developers hand-tuning sizes at every breakpoint,
on every component — a never-ending chore that's easy to do inconsistently.

**What Nice does:** The size values themselves shift across phone, tablet,
laptop, and desktop. You define the responsive scale **once, centrally**, and
every component using those sizes adapts. Components become responsive without
responsive code.

**What the alternatives require (verified) — this is Nice's most distinctive
edge:**
- **Material UI — no.** Its values do not resize by screen on their own. There's
  a one-line helper that scales text down on small screens, but responsive
  *spacing* is entirely hand-done per component.
- **Ant Design — no.** Its values are single fixed sizes; responsiveness is
  built by hand using its grid and screen-size tools.
- **Chakra & Radix Themes — partial.** Neither bakes responsiveness into the
  values. Instead they let a developer list a value per screen size *each time
  they use it* — better than nothing, but still repeated, per-element work.

**Why it matters to you:** *none* of the four solve this at the values layer the
way Nice does. For a small team, "one responsive scale, applied everywhere
automatically" versus "tune it again on every element" is a large, recurring
time difference. This is the advantage where Nice is most uniquely ahead.

---

### 5. It's one small system — not five separate subsystems each with its own setup

**The grind it removes:** In most systems, theming, dark mode, custom values,
responsiveness, and type-safety are *separate* features, each with its own
switch to flip, library to add, or limitation to work around. The hidden cost is
all the setup, learning, and glue code holding them together.

**What Nice does:** All of the above are one coherent model. Nothing to turn on,
no extra theming library, no separate "responsive system," no parallel place for
custom values. A new engineer learns one thing.

**What the alternatives require (verified, summarized):** turning on a
CSS-variable mode (MUI, Ant); adding a separate library for the dark switch
(Chakra's latest); running an extra code-generation step for safety
(Chakra, see #6); accepting that custom values aren't supported (Ant); writing
bookkeeping code per custom value (MUI); and, with the bare Radix Primitives,
**building the entire token/theme/dark/responsive system yourself**.

**Why it matters to you:** fewer moving parts means faster onboarding, less to
maintain, and fewer ways for the system to be set up wrong. For small,
fast-moving teams this compounding simplicity is often the biggest practical win
of all — it's the connective tissue behind ranks 1–4.

---

### 6. Typo-proof design values — with no extra build step

**The grind it removes:** Referencing a value that doesn't exist (a typo, a
renamed token) is a classic source of bugs that only surface later. Catching them
automatically is valuable; having to maintain extra machinery to get that
safety is a cost.

**What Nice does:** The list of valid values is generated automatically from the
single source, so editors auto-complete them and a typo fails the build — with
no separate step to run or keep in sync.

**What the alternatives require (verified):** Material UI gives strong safety for
built-ins but needs the per-custom-value bookkeeping (from #1). Chakra's latest
offers it through an **extra code-generation command** the team must also run in
its automated pipeline. Ant is strict for built-ins but uses that same
strictness to *block* custom values (from #1).

**Why it matters to you:** the same safety net, without an extra step to operate
or forget.

---

### 7. No separate theming library or heavy "anti-flicker" plumbing

**The grind it removes:** Setup and dependencies that exist only to make theming
work — extra libraries, special scripts to prevent first-load flicker, and (for
server-rendered apps) extra wiring to avoid styling glitches.

**What Nice does:** Theming is built in; the default mode needs no extra library
and no anti-flicker script.

**What the alternatives require (verified):** Chakra's latest relies on a
separate dark-mode library; MUI and Chakra both recommend a small startup script
to avoid the wrong-theme flash; Ant's default styling approach requires deliberate
extra setup for fast, server-rendered pages.

**Why it matters to you:** less to install, fewer edge cases, fewer "why does it
flicker on load" tickets.

---

### 8. A flat, shallow set of values that's easy to learn and audit

**The grind it removes:** Some systems stack several layers of values on top of
each other; finding "the one that actually controls this" means digging.

**What Nice does:** A deliberately flat model — fewer layers, faster to learn,
easier to audit for consistency.

**Why it matters to you:** quicker onboarding and easier design reviews. (This
mirrors a row already on the Why page, where only Radix shares it among the four.)

---

### 9. Built by composing simple pieces, with small, focused components

**The grind it removes:** Systems that pile up endless option-combinations on
each component create more edge cases, more bugs, and more to test.

**What Nice does:** Favors assembling small, predictable building blocks over
sprawling option lists — fewer surprises.

**Why it matters to you:** more of an engineering-quality benefit than a daily
design chore, which is why it sits at the bottom of *this* particular ranking —
but it's real, and on the Why page only Radix matches it among the four.

---

## At-a-glance scorecard

Effort levels in plain words:
**Automatic** = works with no extra work · **Switch it on** = a one-time setup
you must choose · **Per-screen** = repeated work on each screen/component ·
**Add a library / step** = extra dependency or build step · **Not supported** =
needs a parallel workaround · **Build it yourself** = no built-in support.

| Advantage (most impactful first) | Nice | Material UI | Ant Design | Chakra | Radix |
|---|---|---|---|---|---|
| 1. Add custom values + override built-ins, one place | Automatic | Bookkeeping per value | **Not supported** | Automatic | Themes: automatic · Primitives: build it |
| 2. Dark mode covers custom components too | Automatic | Built-ins yes · custom per-component | Built-ins yes · custom per-component | Automatic (+ a library) | Themes: automatic · Primitives: build it |
| 3. Real CSS variables, on by default | Automatic | Switch it on | Switch it on | Automatic | Themes: automatic (colors) |
| 4. Responsive sizing baked into the values | Automatic | Per-screen | Per-screen | Per-screen | Per-screen |
| 5. One system, not several subsystems | Automatic | Several | Several | Several (+ library/step) | Primitives: build it · Themes: one system |
| 6. Typo-proof values, no extra step | Automatic | Bookkeeping per value | Built-ins only | Add a step | Themes: automatic |
| 7. No extra theming library / anti-flicker setup | Automatic | Startup script | SSR setup | Add a library + script | Themes: light setup |
| 8. Flat, shallow values | Automatic | Layered | Layered | Layered | Primitives: n/a · Themes: moderate |
| 9. Composition over option-sprawl | Automatic | Option-heavy | Option-heavy | Moderate | Yes |

A fair reading: **Chakra and Radix Themes are Nice's closest peers** on the
token/theme axis. Nice's separation from the pack is sharpest on **#4 (responsive
built into the values — no one else does it)**, **#1 vs. Ant (custom values
simply aren't allowed)**, and **#5 (the absence of setup taxes across the board)**.
Against Material UI and Ant Design, Nice's lead is broad; against Chakra and
Radix Themes, it's narrower and comes down to fewer moving parts.

---

## Honest caveats (so this holds up under scrutiny)

- **These are good systems.** Material UI and Ant Design lead on sheer breadth
  of components and enterprise coverage; Radix Primitives lead on accessibility
  and giving teams total control. Nice is not "better at everything" — it's
  optimized to **remove recurring work** for small, fast teams, and that's the
  lens this report uses.
- **Radix is really two products.** The bare *Primitives* intentionally ship no
  design system at all (you build it — maximum control, maximum work); *Radix
  Themes* is the full styled system this report compares against on tokens/theme.
  Both are referenced honestly above.
- **Versions move.** Findings reflect Material UI v7, Ant Design v5 (with v6
  emerging), Chakra v2/v3, and current Radix, as of June 2026. Competitors are
  trending toward CSS variables and easier theming; if one ships a materially
  different model, revisit this report.
- **One technical honesty note:** Nice's *design-value layer* is plain CSS (the
  advantage in #3). Nice's components, like most of these libraries, still use a
  styling engine — the CSS-variable advantage is about the **tokens and
  theming**, not a claim that Nice has zero runtime everywhere.

---

## Bottom line for a design or product leader

If the question is *"which system spares my team the most repeated, tedious work
as the product grows?"*, the answer concentrates in Nice's **design-value
system**: change-and-extend in one place, dark mode that covers everything,
values the browser understands natively, and — uniquely — sizing that adapts to
screens on its own. The deepest advantage isn't any single feature; it's that
all of these are **on by default, in one small system, with none of the
setup taxes** the alternatives ask for. That is time your designers and
engineers spend on the product instead of on plumbing.

---

## Sources (official documentation, accessed June 2026)

**Material UI (v7)**
- Dark mode — https://mui.com/material-ui/customization/dark-mode/
- CSS theme variables (overview / usage / configuration) — https://mui.com/material-ui/customization/css-theme-variables/overview/
- Theming & custom tokens — https://mui.com/material-ui/customization/theming/
- Responsive typography — https://mui.com/material-ui/customization/typography/
- Upgrade to v7 — https://mui.com/material-ui/migration/upgrade-to-v7/

**Ant Design (v5)**
- Customize theme / tokens & algorithms — https://ant.design/docs/react/customize-theme/
- CSS variables mode — https://5x.ant.design/docs/react/css-variables/
- Custom tokens request, closed "not planned" — https://github.com/ant-design/ant-design/issues/40006
- Server-side rendering / style extraction — https://ant.design/docs/react/server-side-rendering/

**Chakra UI (v2 & v3)**
- Theming overview (v3) — https://chakra-ui.com/docs/theming/overview
- Dark mode (v3) — https://www.chakra-ui.com/docs/styling/dark-mode
- CSS variables (v3) — https://chakra-ui.com/docs/theming/customization/css-variables
- CLI / typegen (v3) — https://chakra-ui.com/docs/get-started/cli
- Announcing v3 (runtime engine note) — https://chakra-ui.com/blog/announcing-v3

**Radix (Primitives & Themes)**
- Primitives styling (unstyled) — https://www.radix-ui.com/primitives/docs/guides/styling
- Themes dark mode — https://www.radix-ui.com/themes/docs/theme/dark-mode
- Themes color & CSS variables — https://www.radix-ui.com/themes/docs/theme/color
- Radix Colors scales — https://www.radix-ui.com/colors/docs/palette-composition/scales
- Themes responsive breakpoints — https://www.radix-ui.com/themes/docs/theme/breakpoints

*Nice claims verified against the Nice implementation and manifest:
`read/styles/tokens.md` (CSS-variable tokens, day/night cascade, override + custom
via the same schema) and `read/styles/breakpoints.md` (responsive values shift at
phone/tablet/laptop/desktop).*
