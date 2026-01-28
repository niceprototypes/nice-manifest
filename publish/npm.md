# npm Publishing

## Version Bump

```bash
npm version patch|minor|major
```

## Publish Order

Bottom to top per dependency chain:

1. nice-styles, nice-icons, nice-configuration
2. nice-react-styles
3. nice-react-flex, nice-react-typography
4. nice-react-icon, nice-react-tile
5. nice-react-button
6. nice-react-scroll, nice-react-slider, nice-react-device-detector

## Before Publishing

Verify package.json has semver versions, not `file:` references.

## Publish

```bash
npm publish --access public
```