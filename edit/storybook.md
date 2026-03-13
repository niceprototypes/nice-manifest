# Storybook Story Architecture

This document outlines the file structure and patterns for component stories in `nice-storybook`.

---

## Directory Structure

Each component story follows this structure:

```
stories/Components/{Component}/
├── {Component}.stories.tsx     # Main stories file with meta + story exports
├── {Component}.services.ts     # Helper logic, constants, demo components
├── {Component}.styles.ts       # Styled components (if needed)
├── index.ts                    # Re-exports
└── stories/
    ├── Basic.story.tsx         # Individual story render functions
    ├── Size.story.tsx
    └── {PropName}.story.tsx
```

---

## File Responsibilities

### {Component}.stories.tsx

The main stories file contains:
- Meta object (must be inline for Storybook CSF static analysis)
- Story exports that reference render functions from `./stories/`

```tsx
import type { Meta, StoryObj } from "@storybook/react"
import Button from "nice-react-button"
import BasicStory from "./stories/Basic.story"
import SizeStory from "./stories/Size.story"

const meta = {
  title: "React/Components/Button",
  component: Button,
  parameters: {
    layout: "padded",
    docs: {
      source: { code: null },
      canvas: { sourceState: "none" },
    },
  },
  argTypes: {
    // ... prop definitions
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  name: "basic",
  render: BasicStory,
}

export const Size: Story = {
  name: "size",
  render: SizeStory,
}
```

**Important:** The `meta` object must be defined inline. Storybook's CSF static analyzer cannot resolve imported meta objects.

---

### stories/{PropName}.story.tsx

Individual story files export a render function that returns the `<Story>` component:

```tsx
import Button from "nice-react-button"
import Story from "../../../../src/components/Story"

const SizeStory = () => (
  <Story
    variables={[
      {
        name: "smaller",
        description: 'size="smaller"',
        demo: (
          <Button onClick={() => {}} size="smaller">
            Smaller
          </Button>
        ),
        code: `<Button\n+1onClick={handler}\n+1size="smaller"\n>\n+1{children}\n</Button>`,
      },
      {
        name: "base",
        description: 'size="base"',
        default: true,
        demo: (
          <Button onClick={() => {}} size="base">
            Base
          </Button>
        ),
        code: `<Button onClick={handler}>\n+1{children}\n</Button>`,
      },
      // ... more variants
    ]}
  />
)

export default SizeStory
```

---

### {Component}.services.ts/.tsx

Contains helper logic, constants, and demo components used across stories:

```tsx
// Flex.services.ts
import { getToken } from "nice-react-styles"

export const twoDots = [
  {
    color: getToken("foregroundColor", "error").var,
    height: getToken("cellHeight", "smaller").var,
    width: getToken("cellHeight", "smaller").var,
  },
  {
    color: getToken("foregroundColor", "warning").var,
    height: getToken("cellHeight", "smaller").var,
    width: getToken("cellHeight", "smaller").var,
  },
]

export const threeDots = [
  ...twoDots,
  {
    color: getToken("foregroundColor", "link").var,
    height: getToken("cellHeight", "smaller").var,
    width: getToken("cellHeight", "smaller").var,
  },
]
```

```tsx
// Tile.services.tsx
import Flex from "nice-react-flex"
import Typography from "nice-react-typography"

export const SampleContent = () => (
  <Flex direction="column" gap="small">
    <Typography as="h2" weight="bold">
      Section Title
    </Typography>
    <Typography color="medium">
      Lorem ipsum dolor sit amet.
    </Typography>
  </Flex>
)
```

---

### {Component}.styles.ts

Styled components specific to the story demos (if needed):

```ts
// Most components don't need custom styles
// {Component}.styles.ts

// Component story styles
// No custom styled components needed for {Component} stories
```

---

### index.ts

Simple re-export:

```ts
export * from "./{Component}.stories"
```

---

## Story Variable Object

Each story uses the `<Story>` component with a `variables` array:

```ts
interface StoryVariable {
  name: string              // Display name for the variant
  description?: string      // Prop usage description (e.g., 'size="small"')
  value?: string           // Token value display (e.g., "12px")
  default?: boolean        // Mark as default variant
  demo: React.ReactNode    // Live demo component
  code?: string            // Code snippet (uses +N for indentation)
}
```

### Code Snippet Format

Code snippets use `+N` prefix for indentation levels:

```ts
code: `<Button\n+1onClick={handler}\n+1size="large"\n>\n+1{children}\n</Button>`
```

Renders as:
```tsx
<Button
  onClick={handler}
  size="large"
>
  {children}
</Button>
```

---

## Naming Conventions

| File | Pattern | Example |
|------|---------|---------|
| Main stories | `{Component}.stories.tsx` | `Button.stories.tsx` |
| Individual story | `{PropName}.story.tsx` | `Size.story.tsx` |
| Services | `{Component}.services.ts` or `.tsx` | `Flex.services.ts` |
| Styles | `{Component}.styles.ts` | `Button.styles.ts` |
| Story function | `{PropName}Story` | `SizeStory` |

---

## Import Patterns

### From story files to services

```tsx
// stories/Basic.story.tsx
import { twoDots } from "../Flex.services"
```

### From story files to shared components

```tsx
// stories/Size.story.tsx
import Story from "../../../../src/components/Story"
import DemoDots from "../../../../src/components/DemoDots"
```

---

## Sidebar Hierarchy

Stories are organized by category via the `title` field:

```
Welcome/
├── Design Tokens
├── Design Patterns
└── UI Components
Tokens/
├── Responsive
└── Icons
React/
├── Styles/
│   ├── StylesProvider
│   ├── getToken
│   └── createTokens
├── Hooks/
│   └── useDeviceDetector
└── Components/
    ├── Button, Flex, Icon, Lightbox
    ├── Scroll, Slider, Tile, Typography
Configuration/
├── Rollup, TypeScript, Jest
├── ViteWatcher
└── NPM/Watcher
```

Each section has an MDX docs page (e.g., `stories/Styles/Styles.mdx` with `<Meta title="Tokens" />`). Component/hook stories use a companion MDX file attached via `<Meta of={Stories} />` with `<Stories />` to render all stories inline.

### Code Blocks

Use the `CodeBlock` component for code examples in story render functions:

```tsx
import CodeBlock from "../../src/components/CodeBlock"

<CodeBlock>{`const x = 1`}</CodeBlock>
```

Do not use inline `<pre>/<code>` with repeated style objects. Do not use `<Source>` from `@storybook/addon-docs/blocks` inside story render functions — it requires DocsContext which only exists in MDX docs pages.

---

## Meta Object Constraints

Due to Storybook's CSF (Component Story Format) static analysis:

1. **Meta must be inline** - Cannot import from separate file
2. **Meta must use `satisfies`** - For proper type inference
3. **Default export required** - `export default meta`

```tsx
// ✅ Correct
const meta = { ... } satisfies Meta<typeof Component>
export default meta

// ❌ Will fail - Storybook can't statically analyze imported meta
import { meta } from "./Component.meta"
export default meta

// ❌ Will fail - Re-export also doesn't work
export { meta as default } from "./Component.meta"
```

---

## Layout Parameters

| Layout | Usage |
|--------|-------|
| `padded` | Standard component demos with padding |
| `fullscreen` | Full-width components (Tile, Scroll, Slider) |

---

## Documentation

Component descriptions and setup instructions are written in companion MDX files, not generated via JavaScript. The `generateDescriptionString` service has been removed.

Each component has an MDX file that attaches to its stories via `<Meta of={Stories} />` and renders stories inline with `<Stories />`:

```mdx
import { Meta, Stories } from '@storybook/addon-docs/blocks'
import * as ButtonStories from './Button.stories'

<Meta of={ButtonStories} />

# Button

Install and import:

\`\`\`bash
npm install nice-react-button
\`\`\`

\`\`\`tsx
import Button from "nice-react-button"
\`\`\`

<Stories />
```