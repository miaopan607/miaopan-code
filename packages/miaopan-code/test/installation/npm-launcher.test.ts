import { afterEach, describe, expect, test } from "bun:test"
import { chmod, copyFile, link, mkdir, mkdtemp, rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"

const launcher = path.resolve(import.meta.dir, "../../bin/miaopan-code")
const temporaryDirectories = new Set<string>()

afterEach(async () => {
  await Promise.all([...temporaryDirectories].map((directory) => rm(directory, { recursive: true, force: true })))
  temporaryDirectories.clear()
})

describe("npm launcher", () => {
  test("forwards arguments and exit codes to an explicit binary", async () => {
    const result = await runLauncher(
      launcher,
      ["-e", "process.stdout.write(process.argv.slice(1).join(','))", "a", "b"],
      {
        MIAOPAN_CODE_BIN_PATH: process.execPath,
      },
    )
    expect(result).toEqual({ exitCode: 0, stdout: "a,b", stderr: "" })

    const failed = await runLauncher(launcher, ["-e", "process.exit(23)"], {
      MIAOPAN_CODE_BIN_PATH: process.execPath,
    })
    expect(failed.exitCode).toBe(23)
  })

  test.skipIf(process.platform === "win32")("forwards termination signals", async () => {
    const child = Bun.spawn(
      [
        "node",
        launcher,
        "-e",
        "process.on('SIGTERM', () => process.exit(42)); setInterval(() => {}, 1000); process.stdout.write('ready')",
      ],
      {
        env: { ...process.env, MIAOPAN_CODE_BIN_PATH: process.execPath },
        stdout: "pipe",
        stderr: "ignore",
      },
    )
    const reader = child.stdout.getReader()
    expect(new TextDecoder().decode((await reader.read()).value)).toBe("ready")
    child.kill("SIGTERM")
    expect(await child.exited).toBe(42)
    await reader.cancel()
  })

  test("resolves the scoped platform package without an install script", async () => {
    const directory = await stageLauncher()
    const platform = os.platform() === "win32" ? "windows" : os.platform()
    const packageName = `@miaopan/code-${platform}-${os.arch()}`
    const packageDirectory = path.join(directory, "node_modules", packageName)
    const binary = path.join(packageDirectory, "bin", platform === "windows" ? "miaopan-code.exe" : "miaopan-code")
    await mkdir(path.dirname(binary), { recursive: true })
    await Bun.write(path.join(packageDirectory, "package.json"), JSON.stringify({ name: packageName }))
    await link(process.execPath, binary).catch(() => copyFile(process.execPath, binary))
    await chmod(binary, 0o755)

    const result = await runLauncher(path.join(directory, "bin", "miaopan-code"), [
      "-e",
      "process.stdout.write(process.argv.slice(1).join(','))",
      "platform",
      "package",
    ])
    expect(result).toEqual({ exitCode: 0, stdout: "platform,package", stderr: "" })
  })

  test("reports a localized error when optional dependencies are missing", async () => {
    const directory = await stageLauncher()
    const entrypoint = path.join(directory, "bin", "miaopan-code")
    const chinese = await runLauncher(entrypoint, [], { MIAOPAN_CODE_LANGUAGE: "zh-CN" })
    expect(chinese.exitCode).toBe(1)
    expect(chinese.stderr).toContain("未找到适用于当前平台的 miaopan-code CLI 包")

    const english = await runLauncher(entrypoint, [], { MIAOPAN_CODE_LANGUAGE: "en" })
    expect(english.exitCode).toBe(1)
    expect(english.stderr).toContain("The miaopan-code CLI package for this platform is missing")
  })
})

async function stageLauncher() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "miaopan-code-launcher-"))
  temporaryDirectories.add(directory)
  await mkdir(path.join(directory, "bin"), { recursive: true })
  await Bun.write(path.join(directory, "package.json"), JSON.stringify({ type: "module" }))
  const entrypoint = path.join(directory, "bin", "miaopan-code")
  await Bun.write(entrypoint, Bun.file(launcher))
  await chmod(entrypoint, 0o755)
  return directory
}

async function runLauncher(entrypoint: string, args: string[], input: Record<string, string> = {}) {
  const env = { ...process.env, ...input }
  if (!("MIAOPAN_CODE_BIN_PATH" in input)) delete env.MIAOPAN_CODE_BIN_PATH
  const child = Bun.spawn(["node", entrypoint, ...args], { env, stdout: "pipe", stderr: "pipe" })
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ])
  return { exitCode, stdout, stderr }
}
