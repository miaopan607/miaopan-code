import { Schema } from "effect"
import { t, type Language } from "@miaopan-code/core/i18n"
import type * as HttpClientError from "effect/unstable/http/HttpClientError"

const AccountLanguage = Schema.Literals(["zh-CN", "en"])

const AccountServiceMessageKey = Schema.Literals([
  "error.account_operation_failed",
  "error.account_http_request_failed",
  "error.account_decode_response_failed",
  "error.account_not_found_refresh",
])
export type AccountServiceMessageKey = typeof AccountServiceMessageKey.Type

export const AccountID = Schema.String.pipe(Schema.brand("AccountID"))
export type AccountID = Schema.Schema.Type<typeof AccountID>

export const OrgID = Schema.String.pipe(Schema.brand("OrgID"))
export type OrgID = Schema.Schema.Type<typeof OrgID>

export const AccessToken = Schema.String.pipe(Schema.brand("AccessToken"))
export type AccessToken = Schema.Schema.Type<typeof AccessToken>

export const RefreshToken = Schema.String.pipe(Schema.brand("RefreshToken"))
export type RefreshToken = Schema.Schema.Type<typeof RefreshToken>

export const DeviceCode = Schema.String.pipe(Schema.brand("DeviceCode"))
export type DeviceCode = Schema.Schema.Type<typeof DeviceCode>

export const UserCode = Schema.String.pipe(Schema.brand("UserCode"))
export type UserCode = Schema.Schema.Type<typeof UserCode>

export class Info extends Schema.Class<Info>("Account")({
  id: AccountID,
  email: Schema.String,
  url: Schema.String,
  active_org_id: Schema.NullOr(OrgID),
}) {}

export class Org extends Schema.Class<Org>("Org")({
  id: OrgID,
  name: Schema.String,
}) {}

export class AccountRepoError extends Schema.TaggedErrorClass<AccountRepoError>()("AccountRepoError", {
  language: AccountLanguage,
  cause: Schema.optional(Schema.Defect()),
}) {
  override get message(): string {
    return t(this.language, "error.account_database_failed")
  }
}

export class AccountServiceError extends Schema.TaggedErrorClass<AccountServiceError>()("AccountServiceError", {
  language: AccountLanguage,
  messageKey: AccountServiceMessageKey,
  cause: Schema.optional(Schema.Defect()),
}) {
  override get message(): string {
    return t(this.language, this.messageKey)
  }
}

export class AccountTransportError extends Schema.TaggedErrorClass<AccountTransportError>()("AccountTransportError", {
  language: AccountLanguage,
  method: Schema.String,
  url: Schema.String,
  description: Schema.optional(Schema.String),
  cause: Schema.optional(Schema.Defect()),
}) {
  static fromHttpClientError(error: HttpClientError.TransportError, language: Language): AccountTransportError {
    return new AccountTransportError({
      language,
      method: error.request.method,
      url: error.request.url,
      description: error.description,
      cause: error.cause,
    })
  }

  override get message(): string {
    return [
      t(this.language, "error.account_unreachable", { method: this.method, url: this.url }),
      t(this.language, "error.account_no_response"),
      this.description,
      t(this.language, "error.account_network_hint"),
    ]
      .filter(Boolean)
      .join("\n")
  }
}

export type AccountError = AccountRepoError | AccountServiceError | AccountTransportError

export class Login extends Schema.Class<Login>("Login")({
  code: DeviceCode,
  user: UserCode,
  url: Schema.String,
  server: Schema.String,
  expiry: Schema.Duration,
  interval: Schema.Duration,
}) {}

export class PollSuccess extends Schema.TaggedClass<PollSuccess>()("PollSuccess", {
  email: Schema.String,
}) {}

export class PollPending extends Schema.TaggedClass<PollPending>()("PollPending", {}) {}

export class PollSlow extends Schema.TaggedClass<PollSlow>()("PollSlow", {}) {}

export class PollExpired extends Schema.TaggedClass<PollExpired>()("PollExpired", {}) {}

export class PollDenied extends Schema.TaggedClass<PollDenied>()("PollDenied", {}) {}

export class PollError extends Schema.TaggedClass<PollError>()("PollError", {
  cause: Schema.Defect(),
}) {}

export const PollResult = Schema.Union([PollSuccess, PollPending, PollSlow, PollExpired, PollDenied, PollError])
export type PollResult = Schema.Schema.Type<typeof PollResult>
