#!/usr/bin/env bun
import { Script } from "@miaopan-code/script"
import { $ } from "bun"
import { fileURLToPath } from "url"
import { resolveLanguage, t } from "../src/i18n"

const language = resolveLanguage(process.env.MIAOPAN_CODE_LANGUAGE)

const dir = fileURLToPath(new URL("..", import.meta.url))
process.chdir(dir)
const dryRun = process.argv.includes("--dry-run")

async function published(name: string, version: string) {
  return (await $`npm view ${name}@${version} version`.nothrow()).exitCode === 0
}

await $`bun tsc`
const originalText = await Bun.file("package.json").text()
const pkg = JSON.parse(originalText) as {
  name: string
  version: string
  exports: Record<string, string | { import: string; types: string }>
  dependencies: Record<string, string>
}
const version = Script.version
if (await published(pkg.name, version)) {
  console.log(t(language, "publish_already_published", { name: pkg.name, version }))
} else {
  pkg.version = version
  pkg.dependencies["@miaopan-code/sdk"] = version
  for (const [key, value] of Object.entries(pkg.exports)) {
    if (typeof value !== "string") continue
    const file = value.replace("./src/", "./dist/").replace(".ts", "")
    pkg.exports[key] = {
      import: file + ".js",
      types: file + ".d.ts",
    }
  }
  await Bun.write("package.json", JSON.stringify(pkg, null, 2))
  try {
    await $`find . -maxdepth 1 -type f -name '*.tgz' -delete`
    await $`bun pm pack`
    if (dryRun) {
      await $`npm publish *.tgz --tag ${Script.channel} --access public --dry-run`
    } else {
      await $`npm publish *.tgz --tag ${Script.channel} --access public`
    }
  } finally {
    await Bun.write("package.json", originalText)
  }
}
