import { Effect } from "effect"
import { pathToFileURL } from "url"
import { define } from "../internal"
import { Npm } from "../../npm"
import { zh } from "../../i18n"

export const DynamicProviderPlugin = define({
  id: "dynamic-provider",
  effect: Effect.fn(function* (ctx) {
    const npm = yield* Npm.Service
    yield* ctx.aisdk.sdk(
      Effect.fn(function* (evt) {
        if (evt.sdk) return

        const installedPath = evt.package.startsWith("file://")
          ? evt.package
          : (yield* npm.add(evt.package).pipe(Effect.orDie)).entrypoint
        if (!installedPath) throw new Error(zh("error.provider_package_entrypoint_missing", { package: evt.package }))

        const mod = yield* Effect.promise(async () => {
          return (await import(
            installedPath.startsWith("file://") ? installedPath : pathToFileURL(installedPath).href
          )) as Record<string, (options: any) => any>
        }).pipe(Effect.orDie)
        const match = Object.keys(mod).find((name) => name.startsWith("create"))
        if (!match) throw new Error(zh("error.provider_factory_missing", { package: evt.package }))

        evt.sdk = mod[match](evt.options)
      }),
    )
  }),
})
