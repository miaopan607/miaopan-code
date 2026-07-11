import path from "path"
import { fileURLToPath, pathToFileURL } from "url"
import npa from "npm-package-arg"
import semver from "semver"
import { Filesystem } from "@/util/filesystem"
import { isRecord } from "@/util/record"
import { Npm } from "@miaopan-code/core/npm"
import { t, type Language } from "@miaopan-code/core/i18n"

// Old npm package names for plugins that are now built-in
export const DEPRECATED_PLUGIN_PACKAGES = ["miaopanCode-openai-codex-auth", "miaopanCode-copilot-auth"]

export function isDeprecatedPlugin(spec: string) {
  return DEPRECATED_PLUGIN_PACKAGES.some((pkg) => spec.includes(pkg))
}

function parse(spec: string) {
  try {
    return npa(spec)
  } catch {}
}

export function parsePluginSpecifier(spec: string) {
  const hit = parse(spec)
  if (hit?.type === "alias" && !hit.name) {
    const sub = (hit as npa.AliasResult).subSpec
    if (sub?.name) {
      const version = !sub.rawSpec || sub.rawSpec === "*" ? "latest" : sub.rawSpec
      return { pkg: sub.name, version }
    }
  }
  if (!hit?.name) return { pkg: spec, version: "" }
  if (hit.raw === hit.name) return { pkg: hit.name, version: "latest" }
  return { pkg: hit.name, version: hit.rawSpec }
}

export type PluginSource = "file" | "npm"
export type PluginKind = "server" | "tui"
type PluginMode = "strict" | "detect"

export type PluginPackage = {
  dir: string
  pkg: string
  json: Record<string, unknown>
}

export type PluginEntry = {
  spec: string
  source: PluginSource
  target: string
  pkg?: PluginPackage
  entry?: string
}

export class PluginDirectoryMissingError extends Error {}

const INDEX_FILES = ["index.ts", "index.tsx", "index.js", "index.mjs", "index.cjs"]

export function pluginSource(spec: string): PluginSource {
  if (isPathPluginSpec(spec)) return "file"
  return "npm"
}

function resolveExportPath(raw: string, dir: string) {
  if (raw.startsWith("file://")) return fileURLToPath(raw)
  if (path.isAbsolute(raw)) return raw
  return path.resolve(dir, raw)
}

function isAbsolutePath(raw: string) {
  return path.isAbsolute(raw) || /^[A-Za-z]:[\\/]/.test(raw)
}

function extractExportValue(value: unknown): string | undefined {
  if (typeof value === "string") return value
  if (!isRecord(value)) return undefined
  for (const key of ["import", "default"]) {
    const nested = value[key]
    if (typeof nested === "string") return nested
  }
  return undefined
}

function packageMain(pkg: PluginPackage) {
  const value = pkg.json.main
  if (typeof value !== "string") return
  const next = value.trim()
  if (!next) return
  return next
}

function resolvePackageFile(spec: string, raw: string, kind: string, pkg: PluginPackage, language?: Language) {
  const resolved = resolveExportPath(raw, pkg.dir)
  const root = Filesystem.resolve(pkg.dir)
  const next = Filesystem.resolve(resolved)
  if (!Filesystem.contains(root, next)) {
    throw new Error(t(language, "error.plugin_entry_outside", { spec, kind }))
  }
  return next
}

function resolvePackagePath(spec: string, raw: string, kind: PluginKind, pkg: PluginPackage, language?: Language) {
  return pathToFileURL(resolvePackageFile(spec, raw, kind, pkg, language)).href
}

function resolvePackageEntrypoint(spec: string, kind: PluginKind, pkg: PluginPackage, language?: Language) {
  const exports = pkg.json.exports
  if (isRecord(exports)) {
    const raw = extractExportValue(exports[`./${kind}`])
    if (raw) return resolvePackagePath(spec, raw, kind, pkg, language)
  }

  if (kind !== "server") return
  const main = packageMain(pkg)
  if (!main) return
  return resolvePackagePath(spec, main, kind, pkg)
}

function targetPath(target: string) {
  if (target.startsWith("file://")) return fileURLToPath(target)
  if (path.isAbsolute(target)) return target
}

async function resolveDirectoryIndex(dir: string) {
  for (const name of INDEX_FILES) {
    const file = path.join(dir, name)
    if (await Filesystem.exists(file)) return file
  }
}

async function resolveTargetDirectory(target: string) {
  const file = targetPath(target)
  if (!file) return
  const stat = await Filesystem.statAsync(file)
  if (!stat?.isDirectory()) return
  return file
}

async function resolvePluginEntrypoint(
  spec: string,
  target: string,
  kind: PluginKind,
  pkg?: PluginPackage,
  language?: Language,
) {
  const source = pluginSource(spec)
  const hit =
    pkg ?? (source === "npm" ? await readPluginPackage(target) : await readPluginPackage(target).catch(() => undefined))
  if (!hit) return target

  const entry = resolvePackageEntrypoint(spec, kind, hit, language)
  if (entry) return entry

  const dir = await resolveTargetDirectory(target)

  if (kind === "tui") {
    if (source === "file" && dir) {
      const index = await resolveDirectoryIndex(dir)
      if (index) return pathToFileURL(index).href
    }

    if (source === "npm") return
    if (dir) return

    return target
  }

  if (dir && isRecord(hit.json.exports)) {
    if (source === "file") {
      const index = await resolveDirectoryIndex(dir)
      if (index) return pathToFileURL(index).href
    }

    return
  }

  return target
}

export function isPathPluginSpec(spec: string) {
  return spec.startsWith("file://") || spec.startsWith(".") || isAbsolutePath(spec)
}

export async function resolvePathPluginTarget(spec: string, language?: Language) {
  const raw = spec.startsWith("file://") ? fileURLToPath(spec) : spec
  const file = path.isAbsolute(raw) || /^[A-Za-z]:[\\/]/.test(raw) ? raw : path.resolve(raw)
  const stat = await Filesystem.statAsync(file)
  if (!stat?.isDirectory()) {
    if (spec.startsWith("file://")) return spec
    return pathToFileURL(file).href
  }

  if (await Filesystem.exists(path.join(file, "package.json"))) {
    return pathToFileURL(file).href
  }

  const index = await resolveDirectoryIndex(file)
  if (index) return pathToFileURL(index).href

  throw new PluginDirectoryMissingError(t(language, "error.plugin_directory_missing", { file }))
}

export async function checkPluginCompatibility(
  target: string,
  miaopanCodeVersion: string,
  pkg?: PluginPackage,
  language?: Language,
) {
  if (!semver.valid(miaopanCodeVersion) || semver.major(miaopanCodeVersion) === 0) return
  const hit = pkg ?? (await readPluginPackage(target).catch(() => undefined))
  if (!hit) return
  const engines = hit.json.engines
  if (!isRecord(engines)) return
  const range = engines.miaopanCode
  if (typeof range !== "string") return
  if (!semver.satisfies(miaopanCodeVersion, range)) {
    throw new Error(t(language, "error.plugin_version_required", { range, version: miaopanCodeVersion }))
  }
}

export async function resolvePluginTarget(spec: string, language?: Language) {
  if (isPathPluginSpec(spec)) return resolvePathPluginTarget(spec, language)
  const hit = parse(spec)
  const pkg = hit?.name && hit.raw === hit.name ? `${hit.name}@latest` : spec
  const result = await Npm.add(pkg)
  return result.directory
}

export async function readPluginPackage(target: string): Promise<PluginPackage> {
  const file = target.startsWith("file://") ? fileURLToPath(target) : target
  const stat = await Filesystem.statAsync(file)
  const dir = stat?.isDirectory() ? file : path.dirname(file)
  const pkg = path.join(dir, "package.json")
  const json = await Filesystem.readJson<Record<string, unknown>>(pkg)
  return { dir, pkg, json }
}

export async function createPluginEntry(
  spec: string,
  target: string,
  kind: PluginKind,
  language?: Language,
): Promise<PluginEntry> {
  const source = pluginSource(spec)
  const pkg =
    source === "npm" ? await readPluginPackage(target) : await readPluginPackage(target).catch(() => undefined)
  const entry = await resolvePluginEntrypoint(spec, target, kind, pkg, language)
  return {
    spec,
    source,
    target,
    pkg,
    entry,
  }
}

export function readPackageThemes(spec: string, pkg: PluginPackage, language?: Language) {
  const field = pkg.json["oc-themes"]
  if (field === undefined) return []
  if (!Array.isArray(field)) {
    throw new TypeError(t(language, "error.plugin_themes_invalid", { spec }))
  }

  const list = field.map((item) => {
    if (typeof item !== "string") {
      throw new TypeError(t(language, "error.plugin_theme_entry_invalid", { spec }))
    }

    const raw = item.trim()
    if (!raw) {
      throw new TypeError(t(language, "error.plugin_theme_entry_empty", { spec }))
    }
    if (raw.startsWith("file://") || isAbsolutePath(raw)) {
      throw new TypeError(t(language, "error.plugin_theme_entry_relative", { spec, item }))
    }

    return resolvePackageFile(spec, raw, "oc-themes", pkg, language)
  })

  return Array.from(new Set(list))
}

export function readPluginId(id: unknown, spec: string, language?: Language) {
  if (id === undefined) return
  if (typeof id !== "string") throw new TypeError(t(language, "error.plugin_id_type", { spec, type: typeof id }))
  const value = id.trim()
  if (!value) throw new TypeError(t(language, "error.plugin_id_empty", { spec }))
  return value
}

export function readV1Plugin(
  mod: Record<string, unknown>,
  spec: string,
  kind: PluginKind,
  mode: PluginMode = "strict",
  language?: Language,
) {
  const value = mod.default
  if (!isRecord(value)) {
    if (mode === "detect") return
    throw new TypeError(t(language, "error.plugin_default_object", { spec, kind }))
  }
  if (mode === "detect" && !("id" in value) && !("server" in value) && !("tui" in value)) return

  const server = "server" in value ? value.server : undefined
  const tui = "tui" in value ? value.tui : undefined
  if (server !== undefined && typeof server !== "function") {
    throw new TypeError(t(language, "error.plugin_server_export_invalid", { spec }))
  }
  if (tui !== undefined && typeof tui !== "function") {
    throw new TypeError(t(language, "error.plugin_tui_export_invalid", { spec }))
  }
  if (server !== undefined && tui !== undefined) {
    throw new TypeError(t(language, "error.plugin_export_both", { spec }))
  }
  if (kind === "server" && server === undefined) {
    throw new TypeError(t(language, "error.plugin_default_object", { spec, kind: "server" }))
  }
  if (kind === "tui" && tui === undefined) {
    throw new TypeError(t(language, "error.plugin_default_object", { spec, kind: "tui" }))
  }

  return value
}

export async function resolvePluginId(
  source: PluginSource,
  spec: string,
  target: string,
  id: string | undefined,
  pkg?: PluginPackage,
  language?: Language,
) {
  if (source === "file") {
    if (id) return id
    throw new TypeError(t(language, "error.plugin_path_id_missing", { spec }))
  }
  if (id) return id
  const hit = pkg ?? (await readPluginPackage(target))
  if (typeof hit.json.name !== "string" || !hit.json.name.trim()) {
    throw new TypeError(t(language, "error.plugin_package_name_missing", { package: hit.pkg }))
  }
  return hit.json.name.trim()
}
