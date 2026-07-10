interface ImportMetaEnv {
  readonly MIAOPAN_CODE_CHANNEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "virtual:miaopanCode-server" {
  export namespace Server {
    export const listen: typeof import("../../../miaopanCode/dist/types/src/node").Server.listen
    export type Listener = import("../../../miaopanCode/dist/types/src/node").Server.Listener
  }
  export namespace Config {
    export const get: typeof import("../../../miaopanCode/dist/types/src/node").Config.get
    export type Info = import("../../../miaopanCode/dist/types/src/node").Config.Info
  }
  export const bootstrap: typeof import("../../../miaopanCode/dist/types/src/node").bootstrap
}
