# @miaopan/sdk

Languages: [简体中文](README.md) · English

The JavaScript SDK is generated from the public Protocol and Server `HttpApi` definitions. It exposes typed clients for the legacy API and the V2 API; generated files under `src/gen` and `src/v2/gen` must not be edited manually.

## Regeneration

After changing a public Protocol or Server `HttpApi`, run:

```bash
./packages/sdk/js/script/build.ts
```

The generated SDK remains independent of Core and Server. See the repository [contribution guide](../../../CONTRIBUTING.en.md) and [OpenAPI specification index](../../../specs/README.md) for compatibility and documentation requirements.

## Language

Client and server-launcher errors default to Simplified Chinese. Pass `language: "en"` to `createMiaopanCodeClient`, `createMiaopanCodeServer`, or `createMiaopanCode` to receive English SDK-generated messages. Server response bodies retain the language selected by the server.
