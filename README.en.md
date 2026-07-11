# miaopan-code

Languages: [简体中文](README.md) · English

`miaopan-code` is an open-source AI coding assistant that runs locally.

## Installation

Download the platform-specific CLI archive from [GitHub Releases](https://github.com/miaopan607/miaopan-code/releases), or build from source:

```bash
bun install
bun --cwd packages/miaopan-code run build
```

You can also install the latest CLI with the installer or a package manager:

```bash
curl -fsSL https://github.com/miaopan607/miaopan-code/install | bash
npm i -g @miaopan/code@latest
```

Before installing, remove releases older than 0.1.x. The installer honors
`MIAOPAN_CODE_INSTALL_DIR` and `XDG_BIN_DIR`; otherwise it falls back to
`$HOME/bin` or `$HOME/.miaopan-code/bin`.

## Usage and support

Run `miaopan-code --help` to see CLI commands. Run `miaopan-code serve` to start the API server; without a subcommand, the CLI opens the TUI.
Please report bugs and feature requests through [GitHub Issues](https://github.com/miaopan607/miaopan-code/issues).

## Language

The default language is Simplified Chinese. Set the global `miaopan-code.jsonc` (or `miaopan-code.json`) language to English:

```jsonc
{
  "language": "en",
}
```

In the TUI, enter `/language` to open the language selector. Confirming the selection updates the interface immediately and saves it to the global configuration.

## Agents

The built-in agents can be switched with `Tab`:

- **build** — the default mode with full permissions for development work.
- **plan** — read-only mode for analysis and exploration. File changes are
  denied by default and shell commands require confirmation.

The internal **general** sub-agent is available for complex searches and
multi-step tasks; type `@general` in a message to invoke it.

## Documentation and contributing

See the [official documentation](https://github.com/miaopan607/miaopan-code/docs)
for configuration details. Contributors should read the
[English contribution guide](CONTRIBUTING.en.md) or its
[Chinese version](CONTRIBUTING.md) before opening a pull request.

If you build a project whose name includes “miaopan-code”, state in its README
that it is not an official project of the miaopan-code team and has no
affiliation with it.

## License and attribution

This project is licensed under MIT. See [NOTICE](NOTICE) for attribution and upstream source information.

Join the community on [Feishu](https://applink.feishu.cn/client/chat/chatter/add_by_link?link_token=52ao9352-5623-4fa0-b7dd-3407c392c1af&qr_code=true) or [X.com](https://x.com/miaopan-code).
