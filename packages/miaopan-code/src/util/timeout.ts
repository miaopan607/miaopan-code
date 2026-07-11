import { t, type Language } from "@miaopan-code/core/i18n"

export function withTimeout<T>(promise: Promise<T>, ms: number, label?: string, language?: Language): Promise<T> {
  let timeout: NodeJS.Timeout
  return Promise.race([
    promise.finally(() => {
      clearTimeout(timeout)
    }),
    new Promise<never>((_, reject) => {
      timeout = setTimeout(() => {
        reject(new Error(label ?? t(language, "error.operation_timeout", { ms })))
      }, ms)
    }),
  ])
}
