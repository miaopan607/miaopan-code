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

const originalText = await Bun.file("package.json").text()
const pkg = JSON.parse(originalText) as {
  name: string
  version: string
  exports: Record<string, unknown>
}
const version = Script.version
function transformExports(exports: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(exports).map(([key, value]) => {
      if (typeof value === "string") {
        const file = value.replace("./src/", "./dist/").replace(".ts", "")
        return [key, { import: file + ".js", types: file + ".d.ts" }]
      }
      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        return [key, transformExports(value)]
      }
      return [key, value]
    }),
  )
}
if (await published(pkg.name, version)) {
  console.log(t(language, "publish_already_published", { name: pkg.name, version }))
} else {
  pkg.version = version
  pkg.exports = transformExports(pkg.exports)
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
