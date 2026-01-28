# nice-website-2025

CRA project (react-scripts 5), React 19, styled-components 6, React Router 7.

## Key Paths

- `src/components/` - shared components
- `src/pages/` - route pages
- `src/nice/` - local wrappers for nice-react-* components with token overrides
- `public/storybook/` - embedded Storybook build

## Development

```bash
npm start                    # dev server
npm run dev:packages         # run in separate terminal for linked package rebuilds
```

## After Dependency Changes

```bash
nnl --clean-all
```