#!/usr/bin/env bun
import { $ } from "bun"
import pkg from "../package.json"
import { Script } from "@miaopan-code/script"
import { fileURLToPath } from "url"
import { readdir } from "fs/promises"

const dir = fileURLToPath(new URL("..", import.meta.url))
const packageName = "@miaopan/code"
const dryRun = process.argv.includes("--dry-run")
process.chdir(dir)

async function published(name: string, version: string) {
  return (await $`npm view ${name}@${version} version`.nothrow()).exitCode === 0
}

async function publish(dir: string, name: string, version: string) {
  if (process.platform !== "win32") await $`chmod -R 755 .`.cwd(dir)
  if (await published(name, version)) {
    console.log(`already published ${name}@${version}`)
    return
  }
  await $`find . -maxdepth 1 -type f -name '*.tgz' -delete`.cwd(dir)
  await $`bun pm pack`.cwd(dir)
  if (dryRun) {
    await $`npm publish *.tgz --access public --tag ${Script.channel} --dry-run`.cwd(dir)
    return
  }
  await $`npm publish *.tgz --access public --tag ${Script.channel}`.cwd(dir)
}

const binaries = await Promise.all(
  (await readdir("./dist", { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && entry.name !== pkg.name)
    .map(async (entry) => {
      const binary = await Bun.file(`./dist/${entry.name}/package.json`).json()
      return { dir: entry.name, name: binary.name, version: binary.version }
    }),
)
if (binaries.length === 0) throw new Error("No platform packages found. Run the build first.")

const version = binaries[0].version
if (binaries.some((binary) => binary.version !== version)) throw new Error("Platform package versions must match.")

await $`mkdir -p ./dist/${pkg.name}/bin`
await $`cp ./bin/${pkg.name} ./dist/${pkg.name}/bin/${pkg.name}`
await Bun.file(`./dist/${pkg.name}/LICENSE`).write(await Bun.file("../../LICENSE").text())
await Bun.file(`./dist/${pkg.name}/NOTICE`).write(await Bun.file("../../NOTICE").text())
await Bun.file(`./dist/${pkg.name}/package.json`).write(
  JSON.stringify(
    {
      name: packageName,
      bin: { [pkg.name]: `./bin/${pkg.name}` },
      type: "module",
      version,
      license: pkg.license,
      os: ["darwin", "linux", "win32"],
      cpu: ["arm64", "x64"],
      optionalDependencies: Object.fromEntries(binaries.map((binary) => [binary.name, binary.version])),
    },
    null,
    2,
  ),
)

await Promise.all(binaries.map((binary) => publish(`./dist/${binary.dir}`, binary.name, binary.version)))
await publish(`./dist/${pkg.name}`, packageName, version)
