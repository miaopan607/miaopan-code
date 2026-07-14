import os from "os"

export const originator = "codex-tui"
export const defaultVersion = "0.144.1"

export interface SystemInfo {
  readonly name: string
  readonly version: string
  readonly architecture: string
}

export function version(env: Record<string, string | undefined> = process.env) {
  const value = env.MIAOPAN_CODE_CODEX_VERSION?.trim()
  return sanitizeHeaderValue(value || defaultVersion)
}

export function architecture(value: string = os.arch(), platform: string = os.platform()) {
  if (value === "x64") return "x86_64"
  if (value === "arm64") return platform === "darwin" ? "arm64" : "aarch64"
  return sanitizeToken(value) || "unknown"
}

export async function terminal(
  env: Record<string, string | undefined> = process.env,
  runCommand: (command: string[]) => Promise<string | undefined> = commandOutput,
) {
  const program = nonEmpty(env.TERM_PROGRAM)
  if (program) {
    if (program.trim().toLowerCase() === "tmux" && (nonEmpty(env.TMUX) || nonEmpty(env.TMUX_PANE))) {
      const [termType, termName] = await Promise.all([
        runCommand(["tmux", "display-message", "-p", "#{client_termtype}"]).then(
          (value) => value,
          () => undefined,
        ),
        runCommand(["tmux", "display-message", "-p", "#{client_termname}"]).then(
          (value) => value,
          () => undefined,
        ),
      ])
      const parts = nonEmpty(termType)?.trim().split(/\s+/)
      if (parts?.[0]) return sanitizeToken(parts[1] ? `${parts[0]}/${parts[1]}` : parts[0]) || "unknown"
      const clientTermName = nonEmpty(termName)
      if (clientTermName) return sanitizeToken(clientTermName) || "unknown"
    }

    return terminalToken(program, env.TERM_PROGRAM_VERSION)
  }

  if (env.WEZTERM_VERSION !== undefined) return terminalToken("WezTerm", env.WEZTERM_VERSION)
  if (env.ITERM_SESSION_ID !== undefined || env.ITERM_PROFILE !== undefined || env.ITERM_PROFILE_NAME !== undefined)
    return "iTerm.app"
  if (env.TERM_SESSION_ID !== undefined) return "Apple_Terminal"
  if (env.KITTY_WINDOW_ID !== undefined || env.TERM?.includes("kitty")) return "kitty"
  if (env.ALACRITTY_SOCKET !== undefined || env.TERM === "alacritty") return "Alacritty"
  if (env.KONSOLE_VERSION !== undefined) return terminalToken("Konsole", env.KONSOLE_VERSION)
  if (env.GNOME_TERMINAL_SCREEN !== undefined) return "gnome-terminal"
  if (env.VTE_VERSION !== undefined) return terminalToken("VTE", env.VTE_VERSION)
  if (env.WT_SESSION !== undefined) return "WindowsTerminal"
  return sanitizeToken(nonEmpty(env.TERM) || "unknown") || "unknown"
}

export function format(input: { readonly version: string; readonly system: SystemInfo; readonly terminal: string }) {
  return sanitizeHeaderValue(
    `${originator}/${input.version} (${input.system.name} ${input.system.version}; ${input.system.architecture}) ${input.terminal} (${originator}; ${input.version})`,
  )
}

export async function detectSystem(
  input: {
    readonly platform?: string
    readonly release?: string
    readonly architecture?: string
    readonly osReleasePath?: string
    readonly macOsVersionPath?: string
    readonly runCommand?: (command: string[]) => Promise<string | undefined>
  } = {},
): Promise<SystemInfo> {
  const platform = input.platform ?? os.platform()
  const fallback = {
    name: platformName(platform),
    version: normalizeVersion(input.release ?? os.release()),
    architecture: architecture(input.architecture ?? os.arch(), platform),
  }
  if (platform === "darwin") {
    const productVersion = await macOsProductVersion(
      input.macOsVersionPath ?? "/System/Library/CoreServices/SystemVersion.plist",
      input.runCommand ?? commandOutput,
    )
    return {
      ...fallback,
      version: normalizeVersion(productVersion || fallback.version),
    }
  }
  if (platform !== "linux") return fallback

  return Bun.file(input.osReleasePath ?? "/etc/os-release")
    .text()
    .then(
      (content) => {
        const values = parseOsRelease(content)
        return {
          name: distributionName(values),
          version: normalizeVersion(values.VERSION_ID || fallback.version),
          architecture: fallback.architecture,
        }
      },
      () => fallback,
    )
}

let cachedSystem: Promise<SystemInfo> | undefined

export async function get() {
  const codexVersion = version()
  cachedSystem ??= detectSystem()
  return format({
    version: codexVersion,
    system: await cachedSystem,
    terminal: await terminal(),
  })
}

async function macOsProductVersion(path: string, runCommand: (command: string[]) => Promise<string | undefined>) {
  const fromFile = await Bun.file(path)
    .text()
    .then(
      (content) => content.match(/<key>ProductVersion<\/key>\s*<string>([^<]+)<\/string>/)?.[1],
      () => undefined,
    )
  if (nonEmpty(fromFile)) return fromFile
  return runCommand(["sw_vers", "-productVersion"]).then(
    (value) => value,
    () => undefined,
  )
}

async function commandOutput(command: string[]) {
  const proc = Bun.spawn(command, { stdout: "pipe", stderr: "ignore" })
  const [code, output] = await Promise.all([proc.exited, new Response(proc.stdout).text()])
  if (code !== 0) return
  return nonEmpty(output)?.trim()
}

function terminalToken(name: string, version: string | undefined) {
  const value = nonEmpty(version)
  return sanitizeToken(value ? `${name}/${value}` : name) || "unknown"
}

function nonEmpty(value: string | undefined) {
  return value?.trim() ? value : undefined
}

function normalizeVersion(value: string) {
  if (value === "") return "Unknown"
  const match = value.trim().match(/^(\d+)(?:\.(\d*))?(?:\.(\d*))?$/)
  if (!match) return sanitizeHeaderValue(value)
  return [match[1], match[2] || "0", match[3] || "0"].map((part) => BigInt(part).toString()).join(".")
}

function parseOsRelease(content: string) {
  return Object.fromEntries(
    content
      .split("\n")
      .map((line) => line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/))
      .filter((match): match is RegExpMatchArray => match !== null)
      .map((match) => {
        const quoted = match[2].match(/^(['"])(.*)\1$/)
        return [match[1], (quoted?.[2] ?? match[2]).replace(/\\([\\"'$`])/g, "$1")]
      }),
  ) as Record<string, string>
}

function distributionName(values: Record<string, string>) {
  if (values.ID?.toLowerCase() === "debian") return "Debian"
  return sanitizeHeaderValue(values.NAME || values.ID || "Linux")
}

function platformName(platform: string) {
  if (platform === "darwin") return "Mac OS"
  if (platform === "win32") return "Windows"
  if (platform === "linux") return "Linux"
  return sanitizeHeaderValue(platform) || "Unknown"
}

function sanitizeToken(value: string) {
  return [...value].map((character) => (/^[A-Za-z0-9._/-]$/.test(character) ? character : "_")).join("")
}

function sanitizeHeaderValue(value: string) {
  return [...value]
    .map((character) => {
      const code = character.codePointAt(0) ?? 0
      return code >= 0x20 && code <= 0x7e ? character : "_"
    })
    .join("")
}

export * as CodexUserAgent from "./codex-user-agent"
