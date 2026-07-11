import { LayerNode } from "@miaopan-code/core/effect/layer-node"
import { httpClient } from "@miaopan-code/core/effect/app-node-platform"
import { Cache, Clock, Duration, Effect, Layer, Option, Schema, SchemaGetter, Context } from "effect"
import { serviceUse } from "@miaopan-code/core/effect/service-use"
import { resolveLanguage, type Language } from "@miaopan-code/core/i18n"
import {
  FetchHttpClient,
  HttpClient,
  HttpClientError,
  HttpClientRequest,
  HttpClientResponse,
} from "effect/unstable/http"

import { withTransientReadRetry } from "@/util/effect-http-client"
import { AccountRepo, type AccountRow } from "./repo"
import { normalizeServerUrl } from "./url"
import {
  type AccountError,
  AccountRepoError,
  AccessToken,
  AccountID,
  DeviceCode,
  Info,
  RefreshToken,
  type AccountServiceMessageKey,
  AccountServiceError,
  AccountTransportError,
  Login,
  Org,
  OrgID,
  PollDenied,
  PollError,
  PollExpired,
  PollPending,
  type PollResult,
  PollSlow,
  PollSuccess,
  UserCode,
} from "./schema"

export {
  AccountID,
  type AccountError,
  AccountRepoError,
  AccountServiceError,
  AccountTransportError,
  AccessToken,
  RefreshToken,
  DeviceCode,
  UserCode,
  Info,
  Org,
  OrgID,
  Login,
  PollSuccess,
  PollPending,
  PollSlow,
  PollExpired,
  PollDenied,
  PollError,
  PollResult,
} from "./schema"

export type AccountOrgs = {
  account: Info
  orgs: readonly Org[]
}

export type ActiveOrg = {
  account: Info
  org: Org
}

class RemoteConfig extends Schema.Class<RemoteConfig>("RemoteConfig")({
  config: Schema.Record(Schema.String, Schema.Json),
}) {}

const DurationFromSeconds = Schema.Number.pipe(
  Schema.decodeTo(Schema.Duration, {
    decode: SchemaGetter.transform((n) => Duration.seconds(n)),
    encode: SchemaGetter.transform((d) => Duration.toSeconds(d)),
  }),
)

class TokenRefresh extends Schema.Class<TokenRefresh>("TokenRefresh")({
  access_token: AccessToken,
  refresh_token: RefreshToken,
  expires_in: DurationFromSeconds,
}) {}

class DeviceAuth extends Schema.Class<DeviceAuth>("DeviceAuth")({
  device_code: DeviceCode,
  user_code: UserCode,
  verification_uri_complete: Schema.String,
  expires_in: DurationFromSeconds,
  interval: DurationFromSeconds,
}) {}

class DeviceTokenSuccess extends Schema.Class<DeviceTokenSuccess>("DeviceTokenSuccess")({
  access_token: AccessToken,
  refresh_token: RefreshToken,
  token_type: Schema.Literal("Bearer"),
  expires_in: DurationFromSeconds,
}) {}

class DeviceTokenError extends Schema.Class<DeviceTokenError>("DeviceTokenError")({
  error: Schema.String,
  error_description: Schema.String,
}) {
  toPollResult(): PollResult {
    if (this.error === "authorization_pending") return new PollPending()
    if (this.error === "slow_down") return new PollSlow()
    if (this.error === "expired_token") return new PollExpired()
    if (this.error === "access_denied") return new PollDenied()
    return new PollError({ cause: this.error })
  }
}

const DeviceToken = Schema.Union([DeviceTokenSuccess, DeviceTokenError])

class User extends Schema.Class<User>("User")({
  id: AccountID,
  email: Schema.String,
}) {}

class ClientId extends Schema.Class<ClientId>("ClientId")({ client_id: Schema.String }) {}

class DeviceTokenRequest extends Schema.Class<DeviceTokenRequest>("DeviceTokenRequest")({
  grant_type: Schema.String,
  device_code: DeviceCode,
  client_id: Schema.String,
}) {}

class TokenRefreshRequest extends Schema.Class<TokenRefreshRequest>("TokenRefreshRequest")({
  grant_type: Schema.String,
  refresh_token: RefreshToken,
  client_id: Schema.String,
}) {}

const clientId = "miaopanCode-cli"
const eagerRefreshThreshold = Duration.minutes(5)
const eagerRefreshThresholdMs = Duration.toMillis(eagerRefreshThreshold)

const isTokenFresh = (tokenExpiry: number | null, now: number) =>
  tokenExpiry != null && tokenExpiry > now + eagerRefreshThresholdMs

const mapAccountServiceError =
  (language: Language, messageKey: AccountServiceMessageKey = "error.account_operation_failed") =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, AccountError, R> =>
    effect.pipe(Effect.mapError((cause) => accountErrorFromCause(cause, language, messageKey)))

const accountErrorFromCause = (
  cause: unknown,
  language: Language,
  messageKey: AccountServiceMessageKey,
): AccountError => {
  if (
    cause instanceof AccountRepoError ||
    cause instanceof AccountServiceError ||
    cause instanceof AccountTransportError
  ) {
    return cause
  }

  if (HttpClientError.isHttpClientError(cause)) {
    switch (cause.reason._tag) {
      case "TransportError": {
        return AccountTransportError.fromHttpClientError(cause.reason, language)
      }
      default: {
        return new AccountServiceError({ language, messageKey, cause })
      }
    }
  }

  return new AccountServiceError({ language, messageKey, cause })
}

export interface Interface {
  readonly active: (language?: Language) => Effect.Effect<Option.Option<Info>, AccountError>
  readonly activeOrg: (language?: Language) => Effect.Effect<Option.Option<ActiveOrg>, AccountError>
  readonly list: (language?: Language) => Effect.Effect<Info[], AccountError>
  readonly orgsByAccount: (language?: Language) => Effect.Effect<readonly AccountOrgs[], AccountError>
  readonly remove: (accountID: AccountID, language?: Language) => Effect.Effect<void, AccountError>
  readonly use: (
    accountID: AccountID,
    orgID: Option.Option<OrgID>,
    language?: Language,
  ) => Effect.Effect<void, AccountError>
  readonly orgs: (accountID: AccountID, language?: Language) => Effect.Effect<readonly Org[], AccountError>
  readonly config: (
    accountID: AccountID,
    orgID: OrgID,
    language?: Language,
  ) => Effect.Effect<Option.Option<Record<string, unknown>>, AccountError>
  readonly token: (accountID: AccountID, language?: Language) => Effect.Effect<Option.Option<AccessToken>, AccountError>
  readonly login: (url: string, language?: Language) => Effect.Effect<Login, AccountError>
  readonly poll: (input: Login, language?: Language) => Effect.Effect<PollResult, AccountError>
}

export class Service extends Context.Service<Service, Interface>()("@miaopan-code/Account") {}

export const use = serviceUse(Service)

const layer: Layer.Layer<Service, never, AccountRepo.Service | HttpClient.HttpClient> = Layer.effect(
  Service,
  Effect.gen(function* () {
    const defaultLanguage = resolveLanguage(process.env.MIAOPAN_CODE_LANGUAGE)
    const repo = yield* AccountRepo.Service
    const http = yield* HttpClient.HttpClient
    const httpRead = withTransientReadRetry(http)
    const httpOk = HttpClient.filterStatusOk(http)
    const httpReadOk = HttpClient.filterStatusOk(httpRead)

    const currentLanguage = (requestedLanguage?: Language) => resolveLanguage(requestedLanguage ?? defaultLanguage)

    const executeRead = (request: HttpClientRequest.HttpClientRequest, language: Language) =>
      httpRead.execute(request).pipe(mapAccountServiceError(language, "error.account_http_request_failed"))

    const executeReadOk = (request: HttpClientRequest.HttpClientRequest, language: Language) =>
      httpReadOk.execute(request).pipe(mapAccountServiceError(language, "error.account_http_request_failed"))

    const executeEffectOk = <E>(request: Effect.Effect<HttpClientRequest.HttpClientRequest, E>, language: Language) =>
      request.pipe(
        Effect.flatMap((req) => httpOk.execute(req)),
        mapAccountServiceError(language, "error.account_http_request_failed"),
      )

    const executeEffect = <E>(request: Effect.Effect<HttpClientRequest.HttpClientRequest, E>, language: Language) =>
      request.pipe(
        Effect.flatMap((req) => http.execute(req)),
        mapAccountServiceError(language, "error.account_http_request_failed"),
      )

    const refreshToken = Effect.fnUntraced(function* (row: AccountRow, language: Language) {
      const now = yield* Clock.currentTimeMillis

      const response = yield* executeEffectOk(
        HttpClientRequest.post(`${row.url}/auth/device/token`).pipe(
          HttpClientRequest.acceptJson,
          HttpClientRequest.schemaBodyJson(TokenRefreshRequest)(
            new TokenRefreshRequest({
              grant_type: "refresh_token",
              refresh_token: row.refresh_token,
              client_id: clientId,
            }),
          ),
        ),
        language,
      )

      const parsed = yield* HttpClientResponse.schemaBodyJson(TokenRefresh)(response).pipe(
        mapAccountServiceError(language, "error.account_decode_response_failed"),
      )

      const expiry = Option.some(now + Duration.toMillis(parsed.expires_in))

      yield* repo.persistToken({
        accountID: row.id,
        accessToken: parsed.access_token,
        refreshToken: parsed.refresh_token,
        expiry,
        language,
      })

      return parsed.access_token
    })

    const refreshTokenCache = yield* Cache.make<readonly [AccountID, Language], AccessToken, AccountError>({
      capacity: Number.POSITIVE_INFINITY,
      timeToLive: Duration.zero,
      lookup: Effect.fnUntraced(function* ([accountID, language]) {
        const maybeAccount = yield* repo.getRow(accountID, language)
        if (Option.isNone(maybeAccount)) {
          return yield* Effect.fail(
            new AccountServiceError({ language, messageKey: "error.account_not_found_refresh" }),
          )
        }

        const account = maybeAccount.value
        const now = yield* Clock.currentTimeMillis
        if (isTokenFresh(account.token_expiry, now)) {
          return account.access_token
        }

        return yield* refreshToken(account, language)
      }),
    })

    const resolveToken = Effect.fnUntraced(function* (row: AccountRow, language: Language) {
      const now = yield* Clock.currentTimeMillis
      if (isTokenFresh(row.token_expiry, now)) {
        return row.access_token
      }

      return yield* Cache.get(refreshTokenCache, [row.id, language] as const)
    })

    const resolveAccess = Effect.fnUntraced(function* (accountID: AccountID, language: Language) {
      const maybeAccount = yield* repo.getRow(accountID, language)
      if (Option.isNone(maybeAccount)) return Option.none()

      const account = maybeAccount.value
      const accessToken = yield* resolveToken(account, language)
      return Option.some({ account, accessToken })
    })

    const fetchOrgs = Effect.fnUntraced(function* (url: string, accessToken: AccessToken, language: Language) {
      const response = yield* executeReadOk(
        HttpClientRequest.get(`${url}/api/orgs`).pipe(
          HttpClientRequest.acceptJson,
          HttpClientRequest.bearerToken(accessToken),
        ),
        language,
      )

      return yield* HttpClientResponse.schemaBodyJson(Schema.Array(Org))(response).pipe(
        mapAccountServiceError(language, "error.account_decode_response_failed"),
      )
    })

    const fetchUser = Effect.fnUntraced(function* (url: string, accessToken: AccessToken, language: Language) {
      const response = yield* executeReadOk(
        HttpClientRequest.get(`${url}/api/user`).pipe(
          HttpClientRequest.acceptJson,
          HttpClientRequest.bearerToken(accessToken),
        ),
        language,
      )

      return yield* HttpClientResponse.schemaBodyJson(User)(response).pipe(
        mapAccountServiceError(language, "error.account_decode_response_failed"),
      )
    })

    const token = Effect.fn("Account.token")((accountID: AccountID, requestedLanguage?: Language) =>
      resolveAccess(accountID, currentLanguage(requestedLanguage)).pipe(Effect.map(Option.map((r) => r.accessToken))),
    )

    const active = Effect.fn("Account.active")((requestedLanguage?: Language) =>
      repo.active(currentLanguage(requestedLanguage)),
    )

    const list = Effect.fn("Account.list")((requestedLanguage?: Language) =>
      repo.list(currentLanguage(requestedLanguage)),
    )

    const remove = Effect.fn("Account.remove")((accountID: AccountID, requestedLanguage?: Language) =>
      repo.remove(accountID, currentLanguage(requestedLanguage)),
    )

    const useAccount = Effect.fn("Account.use")(
      (accountID: AccountID, orgID: Option.Option<OrgID>, requestedLanguage?: Language) =>
        repo.use(accountID, orgID, currentLanguage(requestedLanguage)),
    )

    const activeOrg = Effect.fn("Account.activeOrg")(function* (requestedLanguage?: Language) {
      const language = currentLanguage(requestedLanguage)
      const activeAccount = yield* repo.active(language)
      if (Option.isNone(activeAccount)) return Option.none<ActiveOrg>()

      const account = activeAccount.value
      if (!account.active_org_id) return Option.none<ActiveOrg>()

      const accountOrgs = yield* orgs(account.id, language)
      const org = accountOrgs.find((item) => item.id === account.active_org_id)
      if (!org) return Option.none<ActiveOrg>()

      return Option.some({ account, org })
    })

    const orgsByAccount = Effect.fn("Account.orgsByAccount")(function* (requestedLanguage?: Language) {
      const language = currentLanguage(requestedLanguage)
      const accounts = yield* repo.list(language)
      return yield* Effect.forEach(
        accounts,
        (account) =>
          orgs(account.id, language).pipe(
            Effect.catch(() => Effect.succeed([] as readonly Org[])),
            Effect.map((orgs) => ({ account, orgs })),
          ),
        { concurrency: 3 },
      )
    })

    const orgs = Effect.fn("Account.orgs")(function* (accountID: AccountID, requestedLanguage?: Language) {
      const language = currentLanguage(requestedLanguage)
      const resolved = yield* resolveAccess(accountID, language)
      if (Option.isNone(resolved)) return []

      const { account, accessToken } = resolved.value

      return yield* fetchOrgs(account.url, accessToken, language)
    })

    const config = Effect.fn("Account.config")(function* (
      accountID: AccountID,
      orgID: OrgID,
      requestedLanguage?: Language,
    ) {
      const language = currentLanguage(requestedLanguage)
      const resolved = yield* resolveAccess(accountID, language)
      if (Option.isNone(resolved)) return Option.none()

      const { account, accessToken } = resolved.value

      const response = yield* executeRead(
        HttpClientRequest.get(`${account.url}/api/config`).pipe(
          HttpClientRequest.acceptJson,
          HttpClientRequest.bearerToken(accessToken),
          HttpClientRequest.setHeaders({ "x-org-id": orgID }),
        ),
        language,
      )

      if (response.status === 404) return Option.none()

      const ok = yield* HttpClientResponse.filterStatusOk(response).pipe(mapAccountServiceError(language))

      const parsed = yield* HttpClientResponse.schemaBodyJson(RemoteConfig)(ok).pipe(
        mapAccountServiceError(language, "error.account_decode_response_failed"),
      )
      return Option.some(parsed.config)
    })

    const login = Effect.fn("Account.login")(function* (server: string, requestedLanguage?: Language) {
      const language = currentLanguage(requestedLanguage)
      const normalizedServer = normalizeServerUrl(server)
      const response = yield* executeEffectOk(
        HttpClientRequest.post(`${normalizedServer}/auth/device/code`).pipe(
          HttpClientRequest.acceptJson,
          HttpClientRequest.schemaBodyJson(ClientId)(new ClientId({ client_id: clientId })),
        ),
        language,
      )

      const parsed = yield* HttpClientResponse.schemaBodyJson(DeviceAuth)(response).pipe(
        mapAccountServiceError(language, "error.account_decode_response_failed"),
      )
      return new Login({
        code: parsed.device_code,
        user: parsed.user_code,
        url: `${normalizedServer}${parsed.verification_uri_complete}`,
        server: normalizedServer,
        expiry: parsed.expires_in,
        interval: parsed.interval,
      })
    })

    const poll = Effect.fn("Account.poll")(function* (input: Login, requestedLanguage?: Language) {
      const language = currentLanguage(requestedLanguage)
      const response = yield* executeEffect(
        HttpClientRequest.post(`${input.server}/auth/device/token`).pipe(
          HttpClientRequest.acceptJson,
          HttpClientRequest.schemaBodyJson(DeviceTokenRequest)(
            new DeviceTokenRequest({
              grant_type: "urn:ietf:params:oauth:grant-type:device_code",
              device_code: input.code,
              client_id: clientId,
            }),
          ),
        ),
        language,
      )

      const parsed = yield* HttpClientResponse.schemaBodyJson(DeviceToken)(response).pipe(
        mapAccountServiceError(language, "error.account_decode_response_failed"),
      )

      if (parsed instanceof DeviceTokenError) return parsed.toPollResult()
      const accessToken = parsed.access_token

      const user = fetchUser(input.server, accessToken, language)
      const orgs = fetchOrgs(input.server, accessToken, language)

      const [account, remoteOrgs] = yield* Effect.all([user, orgs], { concurrency: 2 })

      // TODO: When there are multiple orgs, let the user choose
      const firstOrgID = remoteOrgs.length > 0 ? Option.some(remoteOrgs[0].id) : Option.none<OrgID>()

      const now = yield* Clock.currentTimeMillis
      const expiry = now + Duration.toMillis(parsed.expires_in)
      const refreshToken = parsed.refresh_token

      yield* repo.persistAccount({
        id: account.id,
        email: account.email,
        url: input.server,
        accessToken,
        refreshToken,
        expiry,
        orgID: firstOrgID,
        language,
      })

      return new PollSuccess({ email: account.email })
    })

    return Service.of({
      active,
      activeOrg,
      list,
      orgsByAccount,
      remove,
      use: useAccount,
      orgs,
      config,
      token,
      login,
      poll,
    })
  }),
)

export const node = LayerNode.make({ service: Service, layer: layer, deps: [AccountRepo.node, httpClient] })

export * as Account from "./account"
