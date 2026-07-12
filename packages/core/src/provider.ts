export * as ProviderV2 from "./provider"

import { Types } from "effect"
import { Provider } from "@miaopan-code/schema/provider"

export const ID = Provider.ID
export type ID = typeof ID.Type

export function canonicalID(providerID: string) {
  if (providerID === "miaopan-code") return ID.opencode
  if (providerID === "miaopan-code-go") return ID.opencodeGo
  return ID.make(providerID)
}

export function normalizeRecord<T>(input: Record<string, T>) {
  if (!("miaopan-code" in input) && !("miaopan-code-go" in input)) return input
  const output = { ...input }
  for (const alias of ["miaopan-code", "miaopan-code-go"]) {
    const providerID = canonicalID(alias)
    if (!(providerID in output) && alias in output) output[providerID] = output[alias]
    delete output[alias]
  }
  return output
}

export const AISDK = Provider.AISDK

export const Native = Provider.Native

export const Api = Provider.Api
export type Api = Provider.Api
export type MutableApi<T extends Api = Api> = T extends Api
  ? Omit<Types.DeepMutable<T>, "settings"> & (undefined extends T["settings"] ? { settings?: any } : { settings: any })
  : never

export const Request = Provider.Request
export type Request = Provider.Request

export const Info = Provider.Info
export type Info = Provider.Info

export type MutableInfo = Omit<Types.DeepMutable<Info>, "api"> & { api: MutableApi }
