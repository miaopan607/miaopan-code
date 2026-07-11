import { Config } from "@/config/config"
import { Provider } from "@/provider/provider"
import * as InstanceState from "@/effect/instance-state"
import { Effect } from "effect"
import { HttpApiBuilder } from "effect/unstable/httpapi"
import { InstanceHttpApi } from "../api"
import { markInstanceForDisposal } from "../lifecycle"

export const configHandlers = HttpApiBuilder.group(InstanceHttpApi, "config", (handlers) =>
  Effect.gen(function* () {
    const providerSvc = yield* Provider.Service
    const configSvc = yield* Config.Service

    const get = Effect.fn("ConfigHttpApi.get")(function* () {
      return yield* configSvc.get()
    })

    const update = Effect.fn("ConfigHttpApi.update")(function* (ctx) {
      yield* configSvc.update(ctx.payload)
      yield* markInstanceForDisposal(yield* InstanceState.context)
      return ctx.payload
    })

    const providers = Effect.fn("ConfigHttpApi.providers")(function* () {
      return configProvidersResult(yield* providerSvc.list())
    })

    const refreshProviders = Effect.fn("ConfigHttpApi.refreshProviders")(function* () {
      return configProvidersResult(yield* providerSvc.refresh())
    })

    return handlers
      .handle("get", get)
      .handle("update", update)
      .handle("providers", providers)
      .handle("refreshProviders", refreshProviders)
  }),
)

function configProvidersResult(providers: Record<string, Provider.Info>) {
  return {
    providers: Object.values(providers).map(Provider.toPublicInfo),
    default: Provider.defaultModelIDs(providers),
  }
}
