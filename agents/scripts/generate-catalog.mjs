#!/usr/bin/env node
/**
 * generate-catalog — writes manifest/agents/catalog.json, the machine-readable
 * component catalog for AI agents.
 *
 * Sources (read-only; nothing in any package is modified):
 *   ~/nice/react-*\/package.json                       package name, version, description, nice-* peers
 *   ~/nice/react-*\/src/index.ts                       public exports (export lines)
 *   ~/nice/react-*\/src/components/{C}/{C}.types.ts    `{C}Props` members, JSDoc, @default, local alias unions
 *   ~/nice/styles/src/tokens/components/{prefix}.json  component token addresses (`prefix.path:variant`)
 *   ~/nice/storybook/stories/React/Components/**.mdx   <Meta title> → Storybook docs ids (component + per-prop)
 *
 * Parsing uses the TypeScript compiler API, borrowed from the first nice-* package
 * that has it installed (storybook first). No install step, no network.
 *
 * Usage: node ~/nice/manifest/agents/scripts/generate-catalog.mjs [--root ~/nice] [--out path]
 */
import { readFileSync, readdirSync, existsSync, writeFileSync, statSync } from "node:fs"
import { join, dirname, resolve, relative } from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import { homedir } from "node:os"

const scriptDir = dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const argValue = (flag, fallback) => {
  const index = args.indexOf(flag)
  return index === -1 ? fallback : args[index + 1].replace(/^~/, homedir())
}
const root = resolve(argValue("--root", join(homedir(), "nice")))
const outFile = resolve(argValue("--out", join(scriptDir, "..", "catalog.json")))

const STORYBOOK_DEPLOYED = "https://niceprototypes.com/ui/?path=/docs/"
const STORYBOOK_LOCAL = "http://localhost:6006/?path=/docs/"
const TOKEN_RESERVED_KEYS = ["$themes", "$breakpoints", "$inverse"]
const STATE_PATTERN = /hover|active|focus|disabled|pressed|checked|selected|error|invalid|open|expanded|loading/i

/** Loads `typescript` from the first package under root that has it installed. */
function loadTypeScript() {
  const candidates = ["storybook", "react-ink", "react-styles", "styles"]
  for (const name of candidates) {
    const manifest = join(root, name, "package.json")
    if (!existsSync(manifest)) continue
    try {
      return createRequire(manifest)("typescript")
    } catch {
      // not installed in this package; try the next
    }
  }
  throw new Error(`typescript not found under ${candidates.map(name => join(root, name)).join(", ")}`)
}
const ts = loadTypeScript()

const readJson = path => JSON.parse(readFileSync(path, "utf8"))
const isDirectory = path => existsSync(path) && statSync(path).isDirectory()
const lowerFirst = value => value.charAt(0).toLowerCase() + value.slice(1)

/** Storybook's id sanitizer: lowercase, every non-alphanumeric run → "-", trimmed. */
const sanitizeStoryId = value =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")

/** First JSDoc paragraph and @default of a node, if any. */
function readJsDoc(node, sourceFile) {
  const docs = ts.getJSDocCommentsAndTags(node).filter(ts.isJSDoc)
  if (docs.length === 0) return {}
  const doc = docs[docs.length - 1]
  const comment = typeof doc.comment === "string" ? doc.comment : (doc.comment ?? []).map(part => part.text ?? "").join("")
  const description = comment.split(/\n\s*\n/)[0].replace(/\s+/g, " ").trim()
  const defaultTag = (doc.tags ?? []).find(tag => tag.tagName.text === "default")
  const defaultValue = defaultTag
    ? (typeof defaultTag.comment === "string" ? defaultTag.comment : defaultTag.getText(sourceFile).replace(/^@default\s*/, "")).trim()
    : undefined
  return { description: description || undefined, default: defaultValue }
}

/** Parses one `{C}.types.ts`: the `{C}Props` members, with local type aliases resolved one level. */
function readPropsFile(typesPath, componentName) {
  const text = readFileSync(typesPath, "utf8")
  const sourceFile = ts.createSourceFile(typesPath, text, ts.ScriptTarget.Latest, true)
  const aliases = new Map()
  let propsNode
  let propsExtends = []

  sourceFile.forEachChild(node => {
    if (ts.isTypeAliasDeclaration(node)) {
      aliases.set(node.name.text, node.type.getText(sourceFile))
      if (node.name.text === `${componentName}Props`) propsNode = node.type
    }
    if (ts.isInterfaceDeclaration(node) && node.name.text === `${componentName}Props`) {
      propsNode = node
      propsExtends = (node.heritageClauses ?? []).flatMap(clause => clause.types.map(type => type.getText(sourceFile)))
    }
  })
  // Fallback: the file's single exported `*Props` interface (e.g. SectionLinks → StickySectionLinksProps)
  if (!propsNode) {
    const candidates = sourceFile.statements.filter(node => ts.isInterfaceDeclaration(node) && node.name.text.endsWith("Props"))
    if (candidates.length === 1) {
      propsNode = candidates[0]
      propsExtends = (propsNode.heritageClauses ?? []).flatMap(clause => clause.types.map(type => type.getText(sourceFile)))
    }
  }
  if (!propsNode) return null

  // `type XProps = A & { … }` — collect the literal members and record the rest as extends
  let members = []
  const collect = typeNode => {
    if (ts.isTypeLiteralNode(typeNode)) members.push(...typeNode.members)
    else if (ts.isIntersectionTypeNode(typeNode)) typeNode.types.forEach(collect)
    else if (ts.isParenthesizedTypeNode(typeNode)) collect(typeNode.type)
    else propsExtends.push(typeNode.getText(sourceFile))
  }
  if (ts.isInterfaceDeclaration(propsNode)) members = [...propsNode.members]
  else collect(propsNode)

  const props = members
    .filter(member => ts.isPropertySignature(member) && member.name)
    .map(member => {
      const name = member.name.getText(sourceFile).replace(/^["']|["']$/g, "")
      const type = member.type ? member.type.getText(sourceFile) : "unknown"
      const resolved = aliases.get(type)
      return {
        name,
        type,
        ...(resolved && resolved !== type ? { resolved } : {}),
        optional: Boolean(member.questionToken),
        ...readJsDoc(member, sourceFile),
      }
    })

  const propsName = ts.isInterfaceDeclaration(propsNode) ? propsNode.name.text : `${componentName}Props`
  return { propsName, props, extends: propsExtends.length ? propsExtends : undefined }
}

/** Flattens a component token JSON into `prefix.path:variant` addresses plus override axes. */
function readComponentTokens(prefix) {
  const path = join(root, "styles", "src", "tokens", "components", `${prefix}.json`)
  if (!existsSync(path)) return null
  const source = readJson(path)
  const addresses = []
  const walk = (node, trail) => {
    for (const [key, value] of Object.entries(node)) {
      if (TOKEN_RESERVED_KEYS.includes(key)) continue
      if (value !== null && typeof value === "object") walk(value, [...trail, key])
      else if (trail.length === 0) addresses.push(`${prefix}.${key}:base`)
      else addresses.push(`${prefix}.${trail.join(".")}:${key}`)
    }
  }
  walk(source, [])
  return {
    prefix,
    source: relative(root, path),
    addresses,
    themes: source.$themes ? Object.keys(source.$themes) : [],
    breakpoints: source.$breakpoints ? Object.keys(source.$breakpoints) : [],
    inverse: Boolean(source.$inverse),
  }
}

/** Every <Meta title> under the storybook component stories, keyed by title. */
function readStoryTitles() {
  const storiesRoot = join(root, "storybook", "stories", "React", "Components")
  const titles = []
  const walk = directory => {
    if (!isDirectory(directory)) return
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry)
      if (isDirectory(path)) walk(path)
      else if (entry.endsWith(".mdx")) {
        const text = readFileSync(path, "utf8")
        const match = text.match(/<Meta[^>]*\btitle="([^"]+)"/)
        if (match) titles.push({ title: match[1], file: relative(root, path) })
        // `<Meta of={XStories} />` — the title lives in the imported CSF file
        else if (/<Meta[^>]*\bof=\{/.test(text)) {
          const csfImport = text.match(/import\s+\*\s+as\s+\w+\s+from\s+["'](\.[^"']+)["']/)
          const csfPath = csfImport && [".tsx", ".ts", ""].map(ext => resolve(directory, csfImport[1] + ext)).find(existsSync)
          const csfTitle = csfPath && readFileSync(csfPath, "utf8").match(/\btitle:\s*["']([^"']+)["']/)
          if (csfTitle) titles.push({ title: csfTitle[1], file: relative(root, path) })
        }
      }
    }
  }
  walk(storiesRoot)
  return titles
}

const storyLink = title => {
  const id = `${sanitizeStoryId(title)}--docs`
  return { id, local: STORYBOOK_LOCAL + id, deployed: STORYBOOK_DEPLOYED + id }
}

/** Export names from a package's src/index.ts (`export { a, default as B }`, `export type { … }`). */
function readExports(indexPath) {
  if (!existsSync(indexPath)) return []
  const text = readFileSync(indexPath, "utf8")
  const names = new Set()
  for (const match of text.matchAll(/export\s+(type\s+)?\{([^}]+)\}/g)) {
    for (const part of match[2].split(",")) {
      const name = part.trim().split(/\s+as\s+/).pop()?.trim()
      if (name) names.add(match[1] ? `type ${name}` : name)
    }
  }
  if (/export\s+\*\s+from/.test(text)) names.add("* (star re-export, see src/index.ts)")
  return [...names]
}

const storyTitles = readStoryTitles()
const packageDirectories = readdirSync(root)
  .filter(entry => entry.startsWith("react-") && existsSync(join(root, entry, "package.json")))
  .sort()

const packages = packageDirectories.map(directory => {
  const packageRoot = join(root, directory)
  const manifest = readJson(join(packageRoot, "package.json"))
  const componentsRoot = join(packageRoot, "src", "components")
  const componentNames = isDirectory(componentsRoot)
    ? readdirSync(componentsRoot).filter(name => existsSync(join(componentsRoot, name, `${name}.types.ts`)))
    : []

  const components = componentNames.map(name => {
    const typesPath = join(componentsRoot, name, `${name}.types.ts`)
    const parsed = readPropsFile(typesPath, name)
    const tokens = readComponentTokens(lowerFirst(name))

    // Storybook: the component page is the title whose last segment is the component;
    // a prop page is `{component title}/{prop}`.
    const componentStory = storyTitles.find(({ title }) => title.split("/").pop() === name)
    const propStories = componentStory
      ? storyTitles.filter(({ title }) => title.startsWith(`${componentStory.title}/`))
      : []
    const props = (parsed?.props ?? []).map(prop => {
      const story = propStories.find(({ title }) => title.split("/").pop().toLowerCase() === prop.name.toLowerCase())
      return story ? { ...prop, story: storyLink(story.title).id } : prop
    })

    const states = [
      ...props.filter(prop => prop.type === "boolean" || /boolean/.test(prop.resolved ?? "")).map(prop => `prop:${prop.name}`),
      ...new Set((tokens?.addresses ?? []).flatMap(address => address.split(/[.:]/).filter(part => STATE_PATTERN.test(part))).map(part => `token:${part}`)),
    ]

    return {
      name,
      types: relative(root, typesPath),
      propsType: parsed?.propsName ?? null,
      extends: parsed?.extends,
      props,
      states,
      tokens,
      story: componentStory ? { ...storyLink(componentStory.title), file: componentStory.file } : null,
      otherStories: propStories
        .filter(({ title }) => !props.some(prop => prop.story === storyLink(title).id))
        .map(({ title }) => storyLink(title).id),
    }
  })

  return {
    package: manifest.name,
    directory,
    version: manifest.version,
    description: manifest.description,
    nicePeers: Object.keys(manifest.peerDependencies ?? {}).filter(name => name.startsWith("nice-")),
    exports: readExports(join(packageRoot, "src", "index.ts")),
    components,
  }
})

const catalog = {
  $comment: "GENERATED by manifest/agents/scripts/generate-catalog.mjs — do not edit by hand. Re-run after any prop/token/story change.",
  generatedAt: new Date().toISOString(),
  root,
  storybook: { local: STORYBOOK_LOCAL, deployed: STORYBOOK_DEPLOYED },
  tokenAddressFormat: "getToken(\"{prefix}.{group.path}:{variant}\") from nice-react-styles",
  packages,
}

writeFileSync(outFile, JSON.stringify(catalog, null, 2) + "\n")
const componentCount = packages.reduce((total, entry) => total + entry.components.length, 0)
const missingProps = packages.flatMap(entry => entry.components.filter(component => !component.propsType).map(component => component.name))
const missingStory = packages.flatMap(entry => entry.components.filter(component => !component.story).map(component => component.name))
console.log(`catalog: ${packages.length} packages, ${componentCount} components → ${relative(process.cwd(), outFile) || outFile}`)
if (missingProps.length) console.log(`  no {C}Props found: ${missingProps.join(", ")}`)
if (missingStory.length) console.log(`  no storybook page: ${missingStory.join(", ")}`)
