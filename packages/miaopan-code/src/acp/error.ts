import { RequestError } from "@agentclientprotocol/sdk"
import { Schema } from "effect"
import { t, type Language } from "@miaopan-code/core/i18n"

export class SessionNotFoundError extends Schema.TaggedErrorClass<SessionNotFoundError>()("ACPSessionNotFoundError", {
  sessionId: Schema.String,
}) {}

export class InvalidConfigOptionError extends Schema.TaggedErrorClass<InvalidConfigOptionError>()(
  "ACPInvalidConfigOptionError",
  {
    configId: Schema.String,
  },
) {}

export class InvalidModelError extends Schema.TaggedErrorClass<InvalidModelError>()("ACPInvalidModelError", {
  modelId: Schema.String,
  providerId: Schema.optional(Schema.String),
}) {}

export class InvalidEffortError extends Schema.TaggedErrorClass<InvalidEffortError>()("ACPInvalidEffortError", {
  effort: Schema.String,
}) {}

export class InvalidModeError extends Schema.TaggedErrorClass<InvalidModeError>()("ACPInvalidModeError", {
  mode: Schema.String,
}) {}

export class AuthRequiredError extends Schema.TaggedErrorClass<AuthRequiredError>()("ACPAuthRequiredError", {
  providerId: Schema.optional(Schema.String),
}) {}

export class UnknownAuthMethodError extends Schema.TaggedErrorClass<UnknownAuthMethodError>()(
  "ACPUnknownAuthMethodError",
  {
    methodId: Schema.String,
  },
) {}

export class UnsupportedOperationError extends Schema.TaggedErrorClass<UnsupportedOperationError>()(
  "ACPUnsupportedOperationError",
  {
    method: Schema.String,
  },
) {}

export class ServiceFailureError extends Schema.TaggedErrorClass<ServiceFailureError>()("ACPServiceFailureError", {
  safeMessage: Schema.String,
  service: Schema.optional(Schema.String),
  errorName: Schema.optional(Schema.String),
}) {}

export type Error =
  | SessionNotFoundError
  | InvalidConfigOptionError
  | InvalidModelError
  | InvalidEffortError
  | InvalidModeError
  | AuthRequiredError
  | UnknownAuthMethodError
  | UnsupportedOperationError
  | ServiceFailureError

export function toRequestError(error: Error, language?: Language) {
  switch (error._tag) {
    case "ACPSessionNotFoundError":
      return RequestError.invalidParams(
        { sessionId: error.sessionId },
        t(language, "acp.session_not_found", { id: error.sessionId }),
      )
    case "ACPInvalidConfigOptionError":
      return RequestError.invalidParams(
        { configId: error.configId },
        t(language, "acp.config_unknown", { id: error.configId }),
      )
    case "ACPInvalidModelError":
      return RequestError.invalidParams(
        { providerId: error.providerId, modelId: error.modelId },
        t(language, "acp.model_not_found", { id: error.modelId }),
      )
    case "ACPInvalidEffortError":
      return RequestError.invalidParams(
        { effort: error.effort },
        t(language, "acp.effort_not_found", { value: error.effort }),
      )
    case "ACPInvalidModeError":
      return RequestError.invalidParams({ mode: error.mode }, t(language, "acp.mode_not_found", { value: error.mode }))
    case "ACPAuthRequiredError":
      return RequestError.authRequired({ providerId: error.providerId }, t(language, "acp.provider_auth_required"))
    case "ACPUnknownAuthMethodError":
      return RequestError.invalidParams(
        { methodId: error.methodId },
        t(language, "acp.auth_method_unknown", { id: error.methodId }),
      )
    case "ACPUnsupportedOperationError":
      return RequestError.methodNotFound(error.method)
    case "ACPServiceFailureError":
      return RequestError.internalError(
        {
          ...(error.service ? { service: error.service } : {}),
          ...(error.errorName ? { errorName: error.errorName } : {}),
        },
        error.safeMessage,
      )
  }
}

export function fromUnknownDefect(_defect: unknown, language?: Language) {
  return new ServiceFailureError({ safeMessage: t(language, "acp.internal_service_failure") })
}
