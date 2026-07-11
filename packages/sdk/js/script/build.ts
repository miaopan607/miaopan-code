#!/usr/bin/env bun
import { fileURLToPath } from "url"

const dir = fileURLToPath(new URL("..", import.meta.url))
process.chdir(dir)

import { $ } from "bun"
import path from "path"
import ts from "typescript"
import { generatedTemplateDoc, legacyDoc, legacyTypeDoc, resolveLanguage, t } from "../src/i18n"

const language = resolveLanguage(process.env.MIAOPAN_CODE_LANGUAGE)

import { createClient } from "@hey-api/openapi-ts"

const miaopanCode = path.resolve(dir, "../../miaopan-code")

// Keep a previously interrupted runtime patch from preventing the generator
// process from loading the legacy SDK before this build can finish repairing it.
const legacySseRuntimePath = "./src/gen/core/serverSentEvents.gen.ts"
const legacySseRuntimeSource = await Bun.file(legacySseRuntimePath).text()
const legacySseRuntimeRepaired = legacySseRuntimeSource
  .replace(
    /(?:import \{ t, type Language \} from ["']\.\.\/\.\.\/i18n\.js["'];?\n\n?)+/,
    'import { t, type Language } from "../../i18n.js"\n\n',
  )
  .replace(/(export const createSseClient = <TData = unknown>\(\{\n)(?:  language,\n)+/, "$1  language,\n")
if (legacySseRuntimeRepaired !== legacySseRuntimeSource) {
  await Bun.write(legacySseRuntimePath, legacySseRuntimeRepaired)
}
const v2PathRuntimePath = "./src/v2/gen/core/pathSerializer.gen.ts"
const v2PathRuntimeSource = await Bun.file(v2PathRuntimePath).text()
const v2PathRuntimeRepaired = v2PathRuntimeSource.replace(
  "language?: Language  allowReserved?: boolean",
  "language?: Language\n  allowReserved?: boolean",
)
if (v2PathRuntimeRepaired !== v2PathRuntimeSource) {
  await Bun.write(v2PathRuntimePath, v2PathRuntimeRepaired)
}
const legacyPathRuntimePath = "./src/gen/core/pathSerializer.gen.ts"
const legacyPathRuntimeSource = await Bun.file(legacyPathRuntimePath).text()
const legacyPathRuntimeRepaired = legacyPathRuntimeSource.replace(
  /(  explode,\n)(?:  language,\n)+/g,
  "$1  language,\n",
)
if (legacyPathRuntimeRepaired !== legacyPathRuntimeSource) {
  await Bun.write(legacyPathRuntimePath, legacyPathRuntimeRepaired)
}

await $`bun dev generate > ${dir}/openapi.json`
  .cwd(miaopanCode)
  .env({ ...process.env, MIAOPAN_CODE_LANGUAGE: language })

const document = (await Bun.file("./openapi.json").json()) as {
  components?: { schemas?: Record<string, unknown> }
  [key: string]: unknown
}
const schemas = document.components?.schemas
if (schemas) {
  const reachable = new Set<string>()
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (typeof value !== "object" || value === null) return
    for (const [key, child] of Object.entries(value)) {
      if (key === "$ref" && typeof child === "string" && child.startsWith("#/components/schemas/")) {
        const name = child.slice("#/components/schemas/".length)
        if (reachable.has(name)) continue
        reachable.add(name)
        visit(schemas[name])
      } else {
        visit(child)
      }
    }
  }
  visit({ ...document, components: { ...document.components, schemas: undefined } })
  for (const name of Object.keys(schemas)) {
    if (/^SessionNext\w+1$/.test(name) && !reachable.has(name)) delete schemas[name]
  }
  await Bun.write("./openapi.json", JSON.stringify(document))
}

await createClient({
  input: "./openapi.json",
  output: {
    path: "./src/v2/gen",
    tsConfigPath: path.join(dir, "tsconfig.json"),
    clean: true,
  },
  plugins: [
    {
      name: "@hey-api/typescript",
      exportFromIndex: false,
    },
    {
      name: "@hey-api/sdk",
      instance: "MiaopanCodeClient",
      exportFromIndex: false,
      auth: false,
      paramsStructure: "flat",
    },
    {
      name: "@hey-api/client-fetch",
      exportFromIndex: false,
      baseUrl: "http://localhost:4096",
    },
  ],
})

const generatedTypes = await Bun.file("./src/v2/gen/types.gen.ts").text()
if (/export type SessionNext\w+1 =/.test(generatedTypes)) {
  throw new Error(t(language, "build_duplicate_session_events"))
}
const historyTypesPatched = generatedTypes.replace(
  /(export type V2SessionHistoryData = \{[\s\S]*?query\?: \{\s*limit\?: )string([;,]\s*after\?: )string/,
  "$1number$2number",
)
if (historyTypesPatched === generatedTypes) {
  throw new Error(t(language, "build_history_types_patch_failed"))
}
await Bun.write("./src/v2/gen/types.gen.ts", historyTypesPatched)

const generatedSdk = await Bun.file("./src/v2/gen/sdk.gen.ts").text()
const historySdkPatched = generatedSdk.replace(
  /(public history[\s\S]*?parameters: \{\s*sessionID: string[;,]\s*limit\?: )string([;,]\s*after\?: )string/,
  "$1number$2number",
)
if (historySdkPatched === generatedSdk) {
  throw new Error(t(language, "build_history_sdk_patch_failed"))
}
await Bun.write("./src/v2/gen/sdk.gen.ts", historySdkPatched)

await Promise.all(
  ["./src/gen/sdk.gen.ts", "./src/v2/gen/sdk.gen.ts"].map(async (sdkPath) => {
    const source = await Bun.file(sdkPath).text()
    const clientDoc =
      /You can provide a client instance returned by `createClient\(\)` instead of\s*\*?\s*individual options\. This might be also useful if you want to implement a\s*\*?\s*custom client\.|可以提供由 `createClient\(\)` 返回的客户端实例，而不是逐项提供选项。如果需要实现自定义客户端，这也会很有用。/
    const metaDoc =
      /You can pass arbitrary values through the `meta` object\. This can be\s*\*?\s*used to access values that aren't defined as part of the SDK function\.|可以通过 `meta` 对象传递任意值，用于访问未定义为 SDK 函数一部分的值。/
    if ((sdkPath.includes("/v2/") && !clientDoc.test(source)) || !metaDoc.test(source)) {
      throw new Error(t(language, "build_sdk_docs_patch_failed", { path: sdkPath }))
    }
    const patched = source
      .replace(clientDoc, t(language, "build_client_option_doc"))
      .replace(metaDoc, t(language, "build_meta_option_doc"))
    await Bun.write(sdkPath, patched)
  }),
)

const legacySdkPath = "./src/gen/sdk.gen.ts"
const legacySdkSource = await Bun.file(legacySdkPath).text()
let legacyDocCount = 0
const legacySdkPatched = legacySdkSource.replace(
  /\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*\n\s*public (\w+)/g,
  (match, _body: string, method: string, offset: number) => {
    const classes = [...legacySdkSource.slice(0, offset).matchAll(/class (\w+)/g)]
    const key = `${classes.at(-1)?.[1]}.${method}`
    const doc = legacyDoc(language, key)
    if (!doc) throw new Error(t(language, "build_sdk_docs_patch_failed", { path: `${legacySdkPath}:${key}` }))
    legacyDocCount++
    return `/**\n   * ${doc}\n   */\n  public ${method}`
  },
)
if (legacyDocCount !== 78) {
  throw new Error(t(language, "build_sdk_docs_patch_failed", { path: `${legacySdkPath}:${legacyDocCount}/78` }))
}
await Bun.write(legacySdkPath, legacySdkPatched)

const legacyTypesPath = "./src/gen/types.gen.ts"
const legacyTypesSource = await Bun.file(legacyTypesPath).text()
let legacyTypeDocCount = 0
const legacyTypesPatched = legacyTypesSource.replace(/\/\*\*((?:(?!\*\/)[\s\S])*)\*\//g, (match, body: string) => {
  const text = body
    .split("\n")
    .map((line) => line.replace(/^\s*\* ?/, "").trim())
    .filter(Boolean)
    .join(" ")
  const doc = legacyTypeDoc(language, text)
  if (!doc) return match
  legacyTypeDocCount++
  return `/**\n * ${doc}\n */`
})
if (legacyTypeDocCount !== 263) {
  throw new Error(t(language, "build_sdk_docs_patch_failed", { path: `${legacyTypesPath}:${legacyTypeDocCount}/263` }))
}
await Bun.write(legacyTypesPath, legacyTypesPatched)

// Patch a @hey-api/openapi-ts codegen bug: SseFn incorrectly passes the
// endpoint's TError into the second generic of ServerSentEventsResult, which
// is the AsyncGenerator's TReturn slot. Iterator return values have nothing
// to do with HTTP errors, and any consumer that calls `.return()` or returns
// from a mock generator gets type-checked against the wrong shape. Drop the
// arg so TReturn defaults to void.
const sseTypesPath = "./src/v2/gen/client/types.gen.ts"
const sseTypesFile = Bun.file(sseTypesPath)
const sseTypesSource = await sseTypesFile.text()
const sseTypesPatched = sseTypesSource.replace(
  "=> Promise<ServerSentEventsResult<TData, TError>>",
  "=> Promise<ServerSentEventsResult<TData>>",
)
if (sseTypesPatched === sseTypesSource) {
  throw new Error(t(language, "build_sse_patch_failed", { path: sseTypesPath }))
}
await Bun.write(sseTypesPath, sseTypesPatched)

function normalizeGeneratedComment(raw: string) {
  if (raw.startsWith("//")) return raw.slice(2).trim()
  return raw
    .replace(/^\/\*+|\*\/$/g, "")
    .split("\n")
    .map((line) => line.replace(/^\s*\* ?/, "").trimEnd())
    .join("\n")
    .trim()
}

function renderGeneratedComment(source: string, offset: number, raw: string, text: string) {
  if (raw.startsWith("//")) return `// ${text}`
  const lineStart = source.lastIndexOf("\n", offset - 1) + 1
  const indent = source.slice(lineStart, offset)
  const opening = raw.startsWith("/**") ? "/**" : "/*"
  const body = text
    .split("\n")
    .map((line) => (line ? `${indent} * ${line}` : `${indent} *`))
    .join("\n")
  return `${opening}\n${body}\n${indent} */`
}

function localizeGeneratedComments(source: string) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, source)
  const edits: Array<{ start: number; end: number; text: string }> = []
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (token !== ts.SyntaxKind.SingleLineCommentTrivia && token !== ts.SyntaxKind.MultiLineCommentTrivia) continue
    const start = scanner.getTokenPos()
    const end = scanner.getTextPos()
    const raw = source.slice(start, end)
    const localized = generatedTemplateDoc(language, normalizeGeneratedComment(raw))
    if (!localized) continue
    edits.push({ start, end, text: renderGeneratedComment(source, start, raw, localized) })
  }
  for (const match of source.matchAll(/\/\/[^\n]*/g)) {
    const start = match.index
    const end = start + match[0].length
    if (edits.some((edit) => edit.start < end && edit.end > start)) continue
    const localized = generatedTemplateDoc(language, normalizeGeneratedComment(match[0]))
    if (!localized) continue
    edits.push({ start, end, text: renderGeneratedComment(source, start, match[0], localized) })
  }
  return {
    count: edits.length,
    source: edits
      .toReversed()
      .reduce((result, edit) => result.slice(0, edit.start) + edit.text + result.slice(edit.end), source),
  }
}

const generatedTemplateRoots = [
  "./src/gen/client.gen.ts",
  "./src/gen/client",
  "./src/gen/core",
  "./src/gen/sdk.gen.ts",
  "./src/gen/types.gen.ts",
  "./src/v2/gen/client.gen.ts",
  "./src/v2/gen/client",
  "./src/v2/gen/core",
  "./src/v2/gen/sdk.gen.ts",
  "./src/v2/gen/types.gen.ts",
]
const generatedTemplatePaths: string[] = []
for (const root of generatedTemplateRoots) {
  if (await Bun.file(root).exists()) {
    generatedTemplatePaths.push(root)
    continue
  }
  for await (const file of new Bun.Glob("**/*.ts").scan(root)) {
    generatedTemplatePaths.push(path.join(root, file))
  }
}
let generatedTemplateDocCount = 0
await Promise.all(
  generatedTemplatePaths.map(async (generatedPath) => {
    const result = localizeGeneratedComments(await Bun.file(generatedPath).text())
    generatedTemplateDocCount += result.count
    await Bun.write(generatedPath, result.source)
  }),
)
if (generatedTemplateDocCount !== 143) {
  throw new Error(
    t(language, "build_sdk_docs_patch_failed", {
      path: `generated-templates:${generatedTemplateDocCount}/143`,
    }),
  )
}

async function patchGeneratedRuntime(generatedPath: string, marker: string, patch: (source: string) => string) {
  const source = await Bun.file(generatedPath).text()
  if (source.includes(marker)) return
  const patched = patch(source)
  if (patched === source || !patched.includes(marker)) {
    throw new Error(t(language, "build_sdk_docs_patch_failed", { path: `${generatedPath}:runtime` }))
  }
  await Bun.write(generatedPath, patched)
}

await Promise.all(
  [
    ["./src/gen/core/types.gen.ts", "../../i18n.js"],
    ["./src/v2/gen/core/types.gen.ts", "../../../i18n.js"],
  ].map(([generatedPath, i18nPath]) =>
    patchGeneratedRuntime(generatedPath, "language?: Language", (source) =>
      source
        .replace(/^(\/\/[^\n]+\n)/, `$1\nimport type { Language } from "${i18nPath}"\n`)
        .replace("export interface Config {", "export interface Config {\n  language?: Language"),
    ),
  ),
)

await Promise.all(
  ["./src/gen/client/utils.gen.ts", "./src/v2/gen/client/utils.gen.ts"].map(async (generatedPath) => {
    const source = await Bun.file(generatedPath).text()
    const patched = source.replace(/^\s*querySerializer: defaultQuerySerializer,?\r?\n/m, "")
    if (patched === source && source.includes("querySerializer: defaultQuerySerializer")) {
      throw new Error(t(language, "build_sdk_docs_patch_failed", { path: `${generatedPath}:query-language` }))
    }
    await Bun.write(generatedPath, patched)
  }),
)

await Promise.all(
  [
    ["./src/gen/core/pathSerializer.gen.ts", "../../i18n.js"],
    ["./src/v2/gen/core/pathSerializer.gen.ts", "../../../i18n.js"],
  ].map(([generatedPath, i18nPath]) =>
    patchGeneratedRuntime(generatedPath, "// miaopan-code-runtime-i18n:path", (source) =>
      source
        .replace(
          new RegExp(`(?:import \\{ t, type Language \\} from ["']${i18nPath.replaceAll(".", "\\.")}["'];?\\n\\n?)+`),
          `import { t, type Language } from "${i18nPath}"\n\n`,
        )
        .replace(/^(\/\/[^\n]+\n)/, `$1\n// miaopan-code-runtime-i18n:path\n`)
        .replace(
          /^(\/\/[^\n]+\n\n\/\/ miaopan-code-runtime-i18n:path\n)(?!\n?import \{ t, type Language \})/,
          `$1\nimport { t, type Language } from "${i18nPath}"\n`,
        )
        .replace(
          /interface SerializePrimitiveOptions \{\n(?!  language\?: Language)/,
          "interface SerializePrimitiveOptions {\n  language?: Language\n",
        )
        .replaceAll("  allowReserved,\n  explode,", "  allowReserved,\n  explode,\n  language,")
        .replaceAll("        allowReserved,\n        name,", "        allowReserved,\n        language,\n        name,")
        .replace(
          /(serializePrimitiveParam\(\{\n)(\s*)allowReserved,\n(?!\2language,)/g,
          "$1$2allowReserved,\n$2language,\n",
        )
        .replace(
          /export const serializePrimitiveParam = \(\{\s*allowReserved,\s*name,\s*value,?\s*\}: SerializePrimitiveParam\) => \{/,
          "export const serializePrimitiveParam = ({ allowReserved, language, name, value }: SerializePrimitiveParam) => {",
        )
        .replace(
          /throw new Error\(\s*(?:["']Deeply-nested arrays\/objects aren’t supported\. Provide your own `querySerializer\(\)` to handle these\.["']|["']不支持深层嵌套的数组\/对象。请提供自定义 `querySerializer\(\)` 处理这些值。["']),?\s*\)/,
          'throw new Error(t(language, "generated_query_nested_unsupported"))',
        ),
    ),
  ),
)

await Promise.all(
  [
    ["./src/gen/core/utils.gen.ts", "../../i18n.js"],
    ["./src/v2/gen/core/utils.gen.ts", "../../../i18n.js"],
  ].map(([generatedPath, i18nPath]) =>
    patchGeneratedRuntime(generatedPath, "language?: Language\n  url", (source) =>
      source
        .replace(/^(\/\/[^\n]+\n)/, `$1\nimport type { Language } from "${i18nPath}"\n`)
        .replace("export interface PathSerializer {", "export interface PathSerializer {\n  language?: Language")
        .replace(
          "export const defaultPathSerializer = ({ path, url: _url }: PathSerializer) => {",
          "export const defaultPathSerializer = ({ language, path, url: _url }: PathSerializer) => {",
        )
        .replace(
          "serializeArrayParam({ explode, name, style, value })",
          "serializeArrayParam({ explode, language, name, style, value })",
        )
        .replaceAll(
          "            explode,\n            name,",
          "            explode,\n            language,\n            name,",
        )
        .replaceAll(
          "            name,\n            value:",
          "            language,\n            name,\n            value:",
        )
        .replace("  querySerializer,\n  url: _url,", "  querySerializer,\n  language,\n  url: _url,")
        .replace(/(  querySerializer: QuerySerializer;?\n)(\s*url: string)/, "$1  language?: Language\n$2")
        .replace("url = defaultPathSerializer({ path, url })", "url = defaultPathSerializer({ language, path, url })"),
    ),
  ),
)

await Promise.all(
  [
    ["./src/gen/client/utils.gen.ts", "../../i18n.js"],
    ["./src/v2/gen/client/utils.gen.ts", "../../../i18n.js"],
  ].map(([generatedPath, i18nPath]) =>
    patchGeneratedRuntime(generatedPath, "createQuerySerializer(options.querySerializer, options.language)", (source) =>
      source
        .replace(/^(\/\/[^\n]+\n)/, `$1\nimport type { Language } from "${i18nPath}"\n`)
        .replace(
          /(export const createQuerySerializer = <T = unknown>\([\s\S]*?: QuerySerializerOptions = \{\})(\) => \{)/,
          "$1, language?: Language$2",
        )
        .replaceAll("            allowReserved:", "            language,\n            allowReserved:")
        .replace("    query: options.query,", "    query: options.query,\n    language: options.language,")
        .replace(
          "createQuerySerializer(options.querySerializer),",
          "createQuerySerializer(options.querySerializer, options.language),",
        ),
    ),
  ),
)

await Promise.all(
  [
    ["./src/gen/core/serverSentEvents.gen.ts", "../../i18n.js"],
    ["./src/v2/gen/core/serverSentEvents.gen.ts", "../../../i18n.js"],
  ].map(([generatedPath, i18nPath]) =>
    patchGeneratedRuntime(generatedPath, "// miaopan-code-runtime-i18n:sse", (source) =>
      source
        .replace(
          new RegExp(`(?:import \\{ t, type Language \\} from ["']${i18nPath.replaceAll(".", "\\.")}["'];?\\n\\n?)+`),
          `import { t, type Language } from "${i18nPath}"\n\n`,
        )
        .replace(/^(\/\/[^\n]+\n)/, `$1\n// miaopan-code-runtime-i18n:sse\n`)
        .replace(
          /^(\/\/[^\n]+\n\n\/\/ miaopan-code-runtime-i18n:sse\n)(?!\n?import \{ t, type Language \})/,
          `$1\nimport { t, type Language } from "${i18nPath}"\n`,
        )
        .replace(
          "export type ServerSentEventsOptions<TData = unknown> = Omit",
          "export type ServerSentEventsOptions<TData = unknown> = { language?: Language } & Omit",
        )
        .replace(/(export const createSseClient = <TData = unknown>\(\{\n)(?:  language,\n)+/, "$1  language,\n")
        .replace(
          /export const createSseClient = <TData = unknown>\(\{\n(?!  language,)/,
          "export const createSseClient = <TData = unknown>({\n  language,\n",
        )
        .replace(
          /throw new Error\(\s*`(?:SSE failed:|SSE 请求失败：) ?\$\{response\.status\} \$\{response\.statusText\}`,?\s*\)/,
          'throw new Error(t(language, "generated_sse_failed", { status: response.status, statusText: response.statusText }))',
        )
        .replace(
          /throw new Error\((?:["']No body in SSE response["']|["']SSE 响应没有正文["'])\)/,
          'throw new Error(t(language, "generated_sse_no_body"))',
        ),
    ),
  ),
)

await patchGeneratedRuntime(
  "./src/v2/gen/sdk.gen.ts",
  "constructor(args?: { client?: Client; key?: string; language?: Language })",
  (source) =>
    source
      .replace(/^(\/\/[^\n]+\n)/, '$1\nimport { t, type Language } from "../../i18n.js"\n')
      .replace(
        "  private readonly instances: Map<string, T> = new Map()",
        "  private readonly instances: Map<string, T> = new Map()\n  private language?: Language",
      )
      .replace(
        /throw new Error\(`?(?:No SDK client found\. Create one with "new MiaopanCodeClient\(\)" to fix this error\.|未找到 SDK 客户端。请使用 "new MiaopanCodeClient\(\)" 创建客户端以修复此错误。)`?\)/,
        'throw new Error(t(this.language, "generated_sdk_client_missing"))',
      )
      .replace(
        "  set(value: T, key?: string): void {",
        "  set(value: T, key?: string, language?: Language): void {\n    this.language = language ?? this.language",
      )
      .replace(
        /constructor\(args\?: \{\s*client\?: Client;\s*key\?: string;?\s*\}\)/,
        "constructor(args?: { client?: Client; key?: string; language?: Language })",
      )
      .replace(
        "MiaopanCodeClient.__registry.set(this, args?.key)",
        "MiaopanCodeClient.__registry.set(this, args?.key, args?.language)",
      ),
)

await $`bun prettier --write src/gen`
await $`bun prettier --write src/v2`
await $`rm -rf dist`
await $`bun tsc`
await $`rm openapi.json`
