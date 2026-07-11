# @miaopan-code/plugin

Languages: [简体中文](README.md) · English

`@miaopan-code/plugin` provides the public plugin types, tool helpers, and TUI extension contracts used by miaopan-code plugins.

- Promise plugin API: [documentation](src/v2/promise/README.en.md)
- Effect plugin API: [documentation](src/v2/effect/README.en.md)
- Tool helpers: import from `@miaopan-code/plugin/tool`
- TUI contracts: import from `@miaopan-code/plugin/tui`

Protocol identifiers, hook names, and command names are stable values and are not translated. Natural-language labels and descriptions supplied by a plugin should select their own locale resources instead of embedding one language in runtime code.
