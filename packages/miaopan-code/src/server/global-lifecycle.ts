import { GlobalBus } from "@/bus/global"
import { InstanceStore } from "@/project/instance-store"
import { Effect } from "effect"
import { Event } from "./event"
import { resolveLanguage, t, type Language } from "@miaopan-code/core/i18n"

export const emitGlobalDisposed = Effect.sync(() =>
  GlobalBus.emit("event", {
    directory: "global",
    payload: {
      type: Event.Disposed.type,
      properties: {},
    },
  }),
)

export const disposeAllInstancesAndEmitGlobalDisposed = Effect.fn("Server.disposeAllInstancesAndEmitGlobalDisposed")(
  function* (options?: { swallowErrors?: boolean; language?: Language }) {
    const store = yield* InstanceStore.Service
    const language = resolveLanguage(options?.language ?? process.env.MIAOPAN_CODE_LANGUAGE)
    yield* Effect.gen(function* () {
      yield* options?.swallowErrors
        ? store
            .disposeAll()
            .pipe(
              Effect.catchCause((cause) =>
                Effect.logWarning(t(language, "log.server_global_disposal_failed"), { cause }),
              ),
            )
        : store.disposeAll()
      yield* emitGlobalDisposed
    }).pipe(Effect.uninterruptible)
  },
)

export * as GlobalLifecycle from "./global-lifecycle"
