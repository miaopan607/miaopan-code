import { describe, expect, test } from "bun:test"
import { CodexUserAgent } from "@/provider/codex-user-agent"
import { tmpdir } from "../fixture/fixture"

describe("provider.codex-user-agent", () => {
  test("formats the upstream Codex User-Agent shape exactly", () => {
    expect(
      CodexUserAgent.format({
        version: "0.144.1",
        system: { name: "Debian", version: "13.0.0", architecture: "x86_64" },
        terminal: "vscode/1.122.1",
      }),
    ).toBe("codex-tui/0.144.1 (Debian 13.0.0; x86_64) vscode/1.122.1 (codex-tui; 0.144.1)")
  })

  test("uses a non-empty version override in both positions and sanitizes controls", () => {
    const version = CodexUserAgent.version({ MIAOPAN_CODE_CODEX_VERSION: " 0.200.0\rtest " })
    const userAgent = CodexUserAgent.format({
      version,
      system: { name: "Debian", version: "13.0.0", architecture: "x86_64" },
      terminal: "vscode/1.122.1",
    })

    expect(userAgent).toStartWith("codex-tui/0.200.0_test ")
    expect(userAgent).toEndWith("(codex-tui; 0.200.0_test)")
    expect(() => new Headers({ "user-agent": userAgent })).not.toThrow()
    expect(CodexUserAgent.version({ MIAOPAN_CODE_CODEX_VERSION: "" })).toBe("0.144.1")
    expect(CodexUserAgent.version({ MIAOPAN_CODE_CODEX_VERSION: "   " })).toBe("0.144.1")
  })

  test("reads Debian release information and normalizes a one-part version", async () => {
    await using tmp = await tmpdir()
    const osReleasePath = `${tmp.path}/os-release`
    await Bun.write(osReleasePath, 'NAME="Debian GNU/Linux"\nID=debian\nVERSION_ID="13"\n')

    expect(
      await CodexUserAgent.detectSystem({
        platform: "linux",
        architecture: "x64",
        release: "6.12.0",
        osReleasePath,
      }),
    ).toEqual({ name: "Debian", version: "13.0.0", architecture: "x86_64" })
  })

  test("falls back safely when release and terminal details are unavailable", async () => {
    const system = await CodexUserAgent.detectSystem({
      platform: "linux",
      architecture: "mips64",
      release: "6.12.0-custom",
      osReleasePath: "/definitely/missing/os-release",
    })
    const userAgent = CodexUserAgent.format({
      version: CodexUserAgent.defaultVersion,
      system,
      terminal: await CodexUserAgent.terminal({}),
    })

    expect(system).toEqual({ name: "Linux", version: "6.12.0-custom", architecture: "mips64" })
    expect(userAgent).toContain("(Linux 6.12.0-custom; mips64) unknown")
    expect(() => new Headers({ "user-agent": userAgent })).not.toThrow()
  })

  test("keeps the macOS product version and Apple Silicon architecture", async () => {
    await using tmp = await tmpdir()
    const macOsVersionPath = `${tmp.path}/SystemVersion.plist`
    await Bun.write(macOsVersionPath, "<plist><dict><key>ProductVersion</key><string>15.5</string></dict></plist>")

    expect(
      await CodexUserAgent.detectSystem({
        platform: "darwin",
        architecture: "arm64",
        release: "24.5.0",
        macOsVersionPath,
      }),
    ).toEqual({ name: "Mac OS", version: "15.5.0", architecture: "arm64" })
    expect(CodexUserAgent.architecture("arm64", "linux")).toBe("aarch64")
  })

  test("falls back to sw_vers for the macOS product version", async () => {
    expect(
      await CodexUserAgent.detectSystem({
        platform: "darwin",
        architecture: "x64",
        release: "24.6.0",
        macOsVersionPath: "/definitely/missing/SystemVersion.plist",
        runCommand: async (command) => {
          expect(command).toEqual(["sw_vers", "-productVersion"])
          return "15.6"
        },
      }),
    ).toEqual({ name: "Mac OS", version: "15.6.0", architecture: "x86_64" })
  })

  test("uses terminal program metadata before other terminal probes", async () => {
    expect(
      await CodexUserAgent.terminal({
        TERM_PROGRAM: "vscode",
        TERM_PROGRAM_VERSION: "1.122.1",
        TERM: "xterm-256color",
        WEZTERM_VERSION: "20240203",
      }),
    ).toBe("vscode/1.122.1")
    expect(await CodexUserAgent.terminal({ TERM: "xterm-256color" })).toBe("xterm-256color")
    expect(await CodexUserAgent.terminal({ TERM_PROGRAM: "bad terminal", TERM_PROGRAM_VERSION: "1\n2" })).toBe(
      "bad_terminal/1_2",
    )
  })

  test("recognizes common terminals without TERM_PROGRAM", async () => {
    expect(
      await Promise.all([
        CodexUserAgent.terminal({ WEZTERM_VERSION: "20240203", TERM: "xterm-256color" }),
        CodexUserAgent.terminal({ ITERM_SESSION_ID: "session", TERM: "xterm-256color" }),
        CodexUserAgent.terminal({ TERM_SESSION_ID: "session", TERM: "xterm-256color" }),
        CodexUserAgent.terminal({ KITTY_WINDOW_ID: "1", TERM: "xterm-kitty" }),
        CodexUserAgent.terminal({ ALACRITTY_SOCKET: "/tmp/alacritty", TERM: "xterm-256color" }),
        CodexUserAgent.terminal({ KONSOLE_VERSION: "240802", TERM: "xterm-256color" }),
        CodexUserAgent.terminal({ GNOME_TERMINAL_SCREEN: "/org/gnome/Terminal", TERM: "xterm-256color" }),
        CodexUserAgent.terminal({ VTE_VERSION: "7600", TERM: "xterm-256color" }),
        CodexUserAgent.terminal({ WT_SESSION: "", TERM: "xterm-256color" }),
      ]),
    ).toEqual([
      "WezTerm/20240203",
      "iTerm.app",
      "Apple_Terminal",
      "kitty",
      "Alacritty",
      "Konsole/240802",
      "gnome-terminal",
      "VTE/7600",
      "WindowsTerminal",
    ])
  })

  test("uses the terminal behind tmux", async () => {
    const commands: string[][] = []
    const runCommand = async (command: string[]) => {
      commands.push(command)
      if (command.at(-1) === "#{client_termtype}") return "ghostty 1.2.3 extra"
      return "xterm-ghostty"
    }

    expect(
      await CodexUserAgent.terminal(
        { TERM_PROGRAM: "tmux", TERM_PROGRAM_VERSION: "3.5", TMUX: "/tmp/tmux-1000/default,1,0" },
        runCommand,
      ),
    ).toBe("ghostty/1.2.3")
    expect(commands).toEqual([
      ["tmux", "display-message", "-p", "#{client_termtype}"],
      ["tmux", "display-message", "-p", "#{client_termname}"],
    ])
  })
})
