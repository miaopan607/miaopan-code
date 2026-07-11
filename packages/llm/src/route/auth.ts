import { Config, Effect, Redacted } from "effect"
import { Headers } from "effect/unstable/http"
import { AuthenticationReason, InvalidRequestReason, LLMError, type LLMRequest } from "../schema"
import { t, type Language } from "../i18n"

const VALUE_SOURCE = "auth.value"
const OPTIONAL_SOURCE = "auth.optional"

export class MissingCredentialError extends Error {
  readonly _tag = "MissingCredentialError"

  constructor(readonly source: string) {
    super(t(undefined, "llm.auth.missing_credential", { source: sourceLabel(undefined, source) }))
  }
}

const sourceLabel = (language: Language | undefined, source: string) => {
  if (source === VALUE_SOURCE) return t(language, "llm.auth.source_value")
  if (source === OPTIONAL_SOURCE) return t(language, "llm.auth.source_optional_value")
  return source
}

export type CredentialError = MissingCredentialError | Config.ConfigError
export type AuthError = CredentialError | LLMError
type Secret = string | Redacted.Redacted | Config.Config<string | Redacted.Redacted>

export interface AuthInput {
  readonly request: LLMRequest
  readonly method: "POST" | "GET"
  readonly url: string
  readonly body: string
  readonly headers: Headers.Headers
}

export interface Credential {
  readonly load: Effect.Effect<Redacted.Redacted, CredentialError>
  readonly orElse: (that: Credential) => Credential
  readonly bearer: () => Auth
  readonly header: (name: string) => Auth
  readonly pipe: <A>(f: (self: Credential) => A) => A
}

export interface Auth {
  readonly apply: (input: AuthInput) => Effect.Effect<Headers.Headers, AuthError>
  readonly andThen: (that: Auth) => Auth
  readonly orElse: (that: Auth) => Auth
  readonly pipe: <A>(f: (self: Auth) => A) => A
}

export const isAuth = (input: unknown): input is Auth =>
  typeof input === "object" && input !== null && "apply" in input && typeof input.apply === "function"

const credential = (load: Effect.Effect<Redacted.Redacted, CredentialError>): Credential => {
  const self: Credential = {
    load,
    orElse: (that) => credential(load.pipe(Effect.catch(() => that.load))),
    bearer: () => fromCredential(self, (secret) => ({ authorization: `Bearer ${secret}` })),
    header: (name) => fromCredential(self, (secret) => ({ [name]: secret })),
    pipe: (f) => f(self),
  }
  return self
}

const auth = (apply: Auth["apply"]): Auth => {
  const self: Auth = {
    apply,
    andThen: (that) =>
      auth((input) => apply(input).pipe(Effect.flatMap((headers) => that.apply({ ...input, headers })))),
    orElse: (that) => auth((input) => apply(input).pipe(Effect.catch(() => that.apply(input)))),
    pipe: (f) => f(self),
  }
  return self
}

const fromCredential = (source: Credential, render: (secret: string) => Headers.Input) =>
  auth((input) =>
    source.load.pipe(Effect.map((secret) => Headers.setAll(input.headers, render(Redacted.value(secret))))),
  )

const secretEffect = (secret: string | Redacted.Redacted, source: string) => {
  const redacted = typeof secret === "string" ? Redacted.make(secret) : secret
  if (Redacted.value(redacted) === "") return Effect.fail(new MissingCredentialError(source))
  return Effect.succeed(redacted)
}

const credentialFromSecret = (secret: Secret, source: string) => {
  if (typeof secret === "string" || Redacted.isRedacted(secret)) return credential(secretEffect(secret, source))
  return credential(
    Effect.gen(function* () {
      return yield* secretEffect(yield* secret, source)
    }),
  )
}

export const value = (secret: string, source = VALUE_SOURCE) => credentialFromSecret(secret, source)

export const optional = (secret: Secret | undefined, source = OPTIONAL_SOURCE) =>
  secret === undefined
    ? credential(Effect.fail(new MissingCredentialError(source)))
    : credentialFromSecret(secret, source)

export const config = (name: string) => credentialFromSecret(Config.redacted(name), name)

export const effect = (load: Effect.Effect<Redacted.Redacted, CredentialError>) => credential(load)

export const none = auth((input) => Effect.succeed(input.headers))

export const headers = (input: Headers.Input) =>
  auth((inputAuth) => Effect.succeed(Headers.setAll(inputAuth.headers, input)))

export const remove = (name: string) => auth((input) => Effect.succeed(Headers.remove(input.headers, name)))

export const custom = (apply: (input: AuthInput) => Effect.Effect<Headers.Headers, LLMError>) => auth(apply)

export const passthrough = none

const credentialInput = (source: Secret | Credential) =>
  typeof source === "string" || Redacted.isRedacted(source) || Config.isConfig(source)
    ? credentialFromSecret(source, VALUE_SOURCE)
    : source

export function bearer(source: Secret | Credential): Auth
export function bearer(source: Secret | Credential) {
  return credentialInput(source).bearer()
}

export const apiKey = bearer

export function header(name: string): (source: Secret | Credential) => Auth
export function header(name: string, source: Secret | Credential): Auth
export function header(name: string, source?: Secret | Credential) {
  if (source === undefined) {
    return (next: Secret | Credential) => credentialInput(next).header(name)
  }
  return credentialInput(source).header(name)
}

export function bearerHeader(name: string): (source: Secret | Credential) => Auth
export function bearerHeader(name: string, source: Secret | Credential): Auth
export function bearerHeader(name: string, source?: Secret | Credential) {
  const render = (input: Secret | Credential) =>
    fromCredential(credentialInput(input), (secret) => ({ [name]: `Bearer ${secret}` }))
  if (source === undefined) return render
  return render(source)
}

const toLLMError = (error: AuthError, language?: Language): LLMError => {
  if (error instanceof MissingCredentialError || error instanceof Config.ConfigError) {
    return new LLMError({
      module: "Auth",
      method: "apply",
      reason:
        error instanceof MissingCredentialError
          ? new AuthenticationReason({
              message: t(language, "llm.auth.missing_credential", { source: sourceLabel(language, error.source) }),
              kind: "missing",
            })
          : new InvalidRequestReason({ message: t(language, "llm.auth.config_failed", { error: error.message }) }),
    })
  }
  return error
}

export const toEffect =
  (input: Auth) =>
  (authInput: AuthInput): Effect.Effect<Headers.Headers, LLMError> =>
    input.apply(authInput).pipe(Effect.mapError((error) => toLLMError(error, authInput.request.language)))

export * as Auth from "./auth"
