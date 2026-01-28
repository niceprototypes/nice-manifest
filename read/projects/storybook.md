# nice-storybook

Storybook 9, Vite, React 19, styled-components 6.

## Key Paths

- `.storybook/main.ts` - Vite config with nice-vite-symlink-watcher
- `stories/Components/` - component stories
- `stories/Configuration/` - build tool docs
- `src/components/Story/` - shared Story display component
- `src/services/generateDescriptionString.ts` - story description helper

## Development

```bash
npm run dev    # storybook + dependency watching
```

## Deploy

```bash
npm run deploy              # to Firebase
npm run deploy:website      # copy to nice-website-2025/public/storybook
```