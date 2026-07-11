import { MoveSession } from "@miaopan-code/core/control-plane/move-session"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { described } from "./metadata"
import { t, type Language } from "../i18n"

const root = "/experimental/control-plane"
export const MoveSessionPayload = Schema.Struct({ ...MoveSession.Input.fields })

export class ApiMoveSessionError extends Schema.ErrorClass<ApiMoveSessionError>("MoveSessionError")(
  {
    name: Schema.Literal("MoveSessionError"),
    data: Schema.Struct({
      message: Schema.String,
    }),
  },
  { httpApiStatus: 400 },
) {}

export const makeControlPlaneApi = (language?: Language) =>
  HttpApi.make("controlPlane").add(
    HttpApiGroup.make("controlPlane")
      .add(
        HttpApiEndpoint.post("moveSession", `${root}/move-session`, {
          payload: MoveSessionPayload,
          success: described(HttpApiSchema.NoContent, t(language, "response_session_moved")),
          error: ApiMoveSessionError,
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "experimental.controlPlane.moveSession",
            summary: t(language, "control_plane_move"),
            description: t(language, "control_plane_move_description"),
          }),
        ),
      )
      .annotateMerge(OpenApi.annotations({ title: "controlPlane", description: t(language, "control_plane_routes") })),
  )

export const ControlPlaneApi = makeControlPlaneApi()
