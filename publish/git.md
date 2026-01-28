# Git

## Commit Format

```
<type>: <description>
```

Types: `feat`, `fix`, `refactor`, `docs`, `chore`

## Multi-Package Changes

Make changes bottom-up per `read/inheritance.md` dependency order.

## Before Committing

```bash
nnl --clean-all
npm run build
npm test
```