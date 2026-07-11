export * as PermissionV1 from "./permission"

import { Schema } from "effect"
export * from "@miaopan-code/schema/permission-v1"
import { ID } from "@miaopan-code/schema/permission-v1"
import { zh } from "../i18n"

export class RejectedError extends Schema.TaggedErrorClass<RejectedError>()("PermissionRejectedError", {}) {
  override get message() {
    return zh("permission.tool_rejected")
  }
}

export class CorrectedError extends Schema.TaggedErrorClass<CorrectedError>()("PermissionCorrectedError", {
  feedback: Schema.String,
}) {
  override get message() {
    return zh("permission.tool_rejected_feedback", { feedback: this.feedback })
  }
}

export class DeniedError extends Schema.TaggedErrorClass<DeniedError>()("PermissionDeniedError", {
  ruleset: Schema.Any,
}) {
  override get message() {
    return zh("permission.tool_denied_rules", { rules: JSON.stringify(this.ruleset) })
  }
}

export class NotFoundError extends Schema.TaggedErrorClass<NotFoundError>()("Permission.NotFoundError", {
  requestID: ID,
}) {}

export type Error = DeniedError | RejectedError | CorrectedError
