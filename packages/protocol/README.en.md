# @miaopan-code/protocol

Languages: [简体中文](README.md) · English

`@miaopan-code/protocol` contains the typed public Protocol and Server `HttpApi` route groups used to build the SDK. Runtime dependencies flow from Schema to Core and Protocol, then from Core and Protocol to Server. Keep protocol fields and route identifiers stable; user-facing descriptions should use the shared i18n resources where applicable.

This package is private to the workspace. Run `bun typecheck` from this directory after changes. When a public API changes, regenerate the JavaScript SDK with `./packages/sdk/js/script/build.ts`.
