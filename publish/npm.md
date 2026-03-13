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
6. nice-react-scroll, nice-react-slider, nice-react-device-detector, nice-react-lightbox

---

## Package Dependencies

### Foundation (no peer deps)

| Package | Runtime Deps | Peer Deps |
|---------|--------------|-----------|
| nice-styles | — | — |
| nice-icons | — | — |
| nice-configuration | — | rollup, typescript, jest (all optional) |

### Context Layer

| Package | Runtime Deps | Peer Deps |
|---------|--------------|-----------|
| nice-react-styles | nice-styles | react, react-dom, styled-components |

### Utility Layer

| Package | Runtime Deps | Peer Deps |
|---------|--------------|-----------|
| nice-react-flex | nice-react-styles | react, react-dom, styled-components |
| nice-react-typography | nice-react-styles | react, react-dom, styled-components |
| nice-react-tile | nice-react-styles | **nice-react-flex**, react, react-dom, styled-components |
| nice-react-icon | nice-icons, nice-react-styles | react, react-dom, styled-components |

### Feature Layer

| Package | Runtime Deps | Peer Deps |
|---------|--------------|-----------|
| nice-react-button | nice-react-styles, nice-react-typography | **nice-react-flex**, **nice-react-icon**, **nice-react-typography**, react, react-dom, styled-components |

### Standalone

| Package | Runtime Deps | Peer Deps |
|---------|--------------|-----------|
| nice-react-scroll | — | react, react-dom, styled-components |
| nice-react-slider | — | react, styled-components |
| nice-react-device-detector | — | react, react-dom |

---

## Peer Dep Versions

| Peer | Required Version |
|------|------------------|
| react | >=19.2.0 |
| react-dom | >=19.2.0 |
| styled-components | >=6.1.18 |
| nice-react-flex | >=2.0.0 |
| nice-react-icon | >=3.0.0 |
| nice-react-typography | >=5.0.0 |

---

## Before Publishing

1. Verify package.json has semver versions, not `file:` references
2. Check peer dep versions match the table above
3. Run `npm pack --dry-run` to verify contents

## Publish

```bash
npm publish --access public
```