# Inline Code Comments

Standards for leaving AI-readable inline comments in implementation logic.

## Purpose

Inline comments exist for AI context recovery. When an AI instance reads a file for the first time, inline comments reduce the reasoning steps needed to understand what the code does and why. JSDoc describes the function contract; inline comments describe the implementation path.

## When to Comment

| Scenario | Comment? | Rationale |
|----------|----------|-----------|
| Branch in control flow (`if`, `else`, ternary) | Yes | State the condition's semantic meaning, not the code |
| Non-obvious transformation (map, reduce, regex) | Yes | State what the output represents |
| Side effect (mutation, I/O, emit) | Yes | State what is being affected and why here |
| Recursion entry or base case | Yes | State termination condition and what each level represents |
| Algorithm with phases (accumulate → transform → emit) | Yes | Label each phase at the top of its block |
| Fallback / default value | Yes | State why this default was chosen |
| Early return / guard clause | Yes | State what invariant is being enforced |
| Self-evident single operation | No | `const name = user.name` needs no comment |
| Type narrowing that the code already reads as | No | `if (typeof x === 'string')` is self-documenting when the branch body makes the intent clear |

## Format

```ts
// {What is happening in domain terms} — {why, if not obvious}
```

Use a single `//` line. Use `—` (em dash) to separate what from why when both are needed. Keep to one line when possible.

### Good

```ts
// Leaf: emit CSS variable from accumulated path segments
if (typeof value === 'string') {

// Branch: recurse deeper, carrying the night node in parallel
} else if (typeof value === 'object' && value !== null) {

// Day primitive — stable reference that is never reassigned by media queries
const dayCssVar = getConstant(cssName, variantName, { mode: "day" })

// Only react to JSON token file changes
if (!filename?.endsWith('.json')) return

// Debounce to batch rapid successive saves
if (debounceTimer) clearTimeout(debounceTimer)

// Log but don't exit — keeps the watcher alive for the next save
console.error('Error regenerating CSS:', error)
```

### Bad

```ts
// Check if value is a string
if (typeof value === 'string') {

// Call getConstant
const dayCssVar = getConstant(cssName, variantName, { mode: "day" })

// Loop through entries
for (const [key, value] of Object.entries(dayNode)) {

// Set x to 5
const x = 5
```

Bad comments restate the code. Good comments state the domain-level intent.

## Density

Target: one comment per control flow decision or non-trivial operation. A function with 20 lines of sequential assignments needs fewer comments than a function with 20 lines of branching logic.

Build scripts and generators (e.g., `generateCss.ts`, `generateTokens.ts`) should be commented more densely than runtime code, because:
1. They run at build time, so errors are harder to trace to a specific line
2. They produce output files that other code depends on — understanding the generation logic is critical for debugging output issues
3. They tend to have multi-phase pipelines (read → validate → transform → emit) that benefit from phase labels

## Section Comments

For functions with distinct phases, use a blank line + comment to label each phase:

```ts
function main() {
  // Read source tokens
  const coreJson = JSON.parse(fs.readFileSync(coreJsonPath, 'utf-8'))

  // Validate night overrides against day defaults
  validateNightTokens(tokens, nightTokens, errors)

  // Generate combined CSS output
  const { css, nightMediaBody } = buildCombinedCss(tokens, nightTokens)

  // Write output files
  fs.writeFileSync(cssPath, css, 'utf-8')
}
```

## JSDoc vs Inline

| Concern | Where |
|---------|-------|
| What a function does, its params, return type, errors | JSDoc above the function |
| What a type represents, its values | JSDoc above the type |
| How the implementation works step by step | Inline comments within the function body |
| Why a specific implementation choice was made | Inline comment at the decision point |