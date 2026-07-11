import { AsyncLocalStorage } from "async_hooks"
import { t, type Language } from "@miaopan-code/core/i18n"

export class NotFound extends Error {
  constructor(
    public override readonly name: string,
    language?: Language,
  ) {
    super(t(language, "error.local_context_not_found", { name }))
  }
}

export function create<T>(name: string, language?: Language) {
  const storage = new AsyncLocalStorage<T>()
  return {
    use() {
      const result = storage.getStore()
      if (!result) {
        throw new NotFound(name, language)
      }
      return result
    },
    provide<R>(value: T, fn: () => R) {
      return storage.run(value, fn)
    },
  }
}

export * as LocalContext from "./local-context"
