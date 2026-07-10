#!/usr/bin/env bun
import { $ } from "bun"
import pkg from "../package.json"
import { Script } from "@miaopan-code/script"
import { fileURLToPath } from "url"

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
    await $`bun publish *.tgz --access public --tag ${Script.channel} --dry-run`.cwd(dir)
    return
  }
  await $`bun publish *.tgz --access public --tag ${Script.channel}`.cwd(dir)
}

const binaries = await Promise.all(
  Array.from(new Bun.Glob("*/package.json").scanSync({ cwd: "./dist" }))
    .filter((file) => file !== `${pkg.name}/package.json`)
    .map(async (file) => {
      const binary = await Bun.file(`./dist/${file}`).json()
      return { dir: file.replace("/package.json", ""), name: binary.name, version: binary.version }
    }),
)
if (binaries.length === 0) throw new Error("No platform packages found. Run the build first.")

const version = binaries[0].version
if (binaries.some((binary) => binary.version !== version)) throw new Error("Platform package versions must match.")

await $`mkdir -p ./dist/${pkg.name}/bin`
await $`cp ./script/postinstall.mjs ./dist/${pkg.name}/postinstall.mjs`
await Bun.file(`./dist/${pkg.name}/LICENSE`).write(await Bun.file("../../LICENSE").text())
await Bun.file(`./dist/${pkg.name}/NOTICE`).write(await Bun.file("../../NOTICE").text())
await Bun.file(`./dist/${pkg.name}/bin/${pkg.name}.exe`).write(
  [
    `echo "Error: ${packageName}'s postinstall script was not run." >&2`,
    'echo "" >&2',
    'echo "This occurs when using --ignore-scripts during installation, or when using a" >&2',
    'echo "package manager like pnpm that does not run postinstall scripts by default." >&2',
    'echo "" >&2',
    'echo "To fix this, run the postinstall script manually:" >&2',
    `echo "  cd node_modules/${packageName} && node postinstall.mjs" >&2`,
    'echo "" >&2',
    `echo "Or reinstall ${packageName} without the --ignore-scripts flag." >&2`,
    "exit 1",
    "",
  ].join("\n"),
)
await Bun.file(`./dist/${pkg.name}/package.json`).write(
  JSON.stringify(
    {
      name: packageName,
      bin: { [pkg.name]: `./bin/${pkg.name}.exe` },
      scripts: { postinstall: "node ./postinstall.mjs" },
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
