import { ProjectV2 } from "@miaopan-code/core/project"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import { WorkspaceRoutingMiddleware, WorkspaceRoutingQuery } from "../middleware/workspace-routing"
import { t, type Language } from "../i18n"

export const GenerateNamePayload = Schema.Struct({
  context: Schema.optional(Schema.String),
})

export const makeProjectCopyApi = (language?: Language) =>
  HttpApi.make("projectCopyName").add(
    HttpApiGroup.make("projectCopyName")
      .add(
        HttpApiEndpoint.post("generateName", "/experimental/project/:projectID/copy/generate-name", {
          params: { projectID: ProjectV2.ID },
          query: WorkspaceRoutingQuery,
          payload: GenerateNamePayload,
          success: Schema.Struct({ name: Schema.String }),
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "experimental.projectCopy.generateName",
            summary: t(language, "project_copy_name"),
            description: t(language, "project_copy_name_description"),
          }),
        ),
      )
      .annotateMerge(OpenApi.annotations({ title: "projectCopy", description: t(language, "project_copy_routes") }))
      .middleware(InstanceContextMiddleware)
      .middleware(WorkspaceRoutingMiddleware)
      .middleware(Authorization),
  )

export const ProjectCopyApi = makeProjectCopyApi()
