# miaopan-code

Languages: [简体中文](README.md) · English

`miaopan-code` is an open-source AI coding assistant that runs locally. It provides a terminal TUI, non-interactive commands, an API server, MCP integration, and plugin support.

## Installation

### npm

```bash
npm install -g @miaopan/code@latest
```

The same package can also be installed globally with `bun`, `pnpm`, or `yarn`.

### GitHub Releases

Download the archive for your platform from [GitHub Releases](https://github.com/miaopan607/miaopan-code/releases/latest), extract it, and run the included `miaopan-code` executable.

### Build from source

Bun 1.3 or later is required:

```bash
bun install
bun --cwd packages/miaopan-code run build
```

Build outputs are written to `packages/miaopan-code/dist/`.

## Quick start

Open the TUI in the current directory:

```bash
miaopan-code .
```

Use `/connect` in the TUI to configure a provider, or use the CLI:

```bash
miaopan-code providers login
miaopan-code models
```

Start with a specific model:

```bash
miaopan-code . --model provider/model
```

## Common workflows

### Non-interactive runs

```bash
miaopan-code run "Explain the structure of this project"
miaopan-code run --format json "Review the current changes"
miaopan-code run --continue "Continue the task"
```

`run` also supports `--session`, `--fork`, `--file`, `--variant`, `--thinking`, and `--interactive`. Run `miaopan-code run --help` for the complete option list.

### API server and remote TUI

```bash
miaopan-code serve --port 4096
miaopan-code attach http://localhost:4096
```

`attach` supports a remote working directory, existing-session recovery, and basic authentication.

### Session management

```bash
miaopan-code session list
miaopan-code export <sessionID> > session.json
miaopan-code import session.json
miaopan-code stats
```

Both the TUI and CLI can continue, fork, and recover sessions. Use `export --sanitize` to hide sensitive transcript and file data before sharing an export.

### MCP, plugins, and agents

```bash
miaopan-code mcp add
miaopan-code mcp list
miaopan-code plugin <module>
miaopan-code agent list
miaopan-code agent create
```

The TUI includes three switchable primary agents. Use `Tab` to cycle forward and `Shift+Tab` to cycle backward:

- `build`: The default agent. It reads and modifies the workspace and executes tools according to the configured permissions, making it suitable for implementation work.
- `ask`: A question-and-answer agent that can read and analyze the workspace but cannot modify files. Use it for code explanations, investigation, and project questions.
- `plan`: A planning agent that cannot edit the workspace. Use it to clarify requirements, explore approaches, and produce an implementation plan before making changes.

Custom agents can also be added through configuration or `miaopan-code agent create`.

## Configuration

Project configuration uses `miaopan-code.jsonc` or `miaopan-code.json`. Place it in the project directory or under `.miaopan-code/`; the global configuration directory depends on the operating system.

Minimal example:

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/miaopan607/miaopan-code/main/schemas/config.json",
  "language": "en",
  "model": "provider/model",
  "autoupdate": "notify",
}
```

See the [configuration guide](docs/configuration.en.md) for configuration locations, merge behavior, agents, skills, plugins, MCP, and permissions. For the complete field list, use `schemas/config.json` from a release or the repository's [configuration schema](schemas/config.json). TUI-specific settings use the [TUI schema](schemas/tui.json).

## Language

Simplified Chinese is the default language, with English available as an additional language. Set `language` to `zh-CN` or `en`, or use `/language` in the TUI. The selection takes effect immediately and is saved to the global configuration.

## Development and contributing

```bash
bun install
bun dev .
```

Before contributing, read the [contribution guide](CONTRIBUTING.en.md) and the repository's [development conventions](AGENTS.md). Report issues and feature requests through [GitHub Issues](https://github.com/miaopan607/miaopan-code/issues).

## License and attribution

This project is licensed under MIT. See [NOTICE](NOTICE) for attribution and upstream source information.
