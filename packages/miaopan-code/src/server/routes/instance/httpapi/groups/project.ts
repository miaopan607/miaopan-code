import { Project } from "@/project/project"
import { ProjectV2 } from "@miaopan-code/core/project"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { ProjectNotFoundError } from "../errors"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import { WorkspaceRoutingMiddleware, WorkspaceRoutingQuery } from "../middleware/workspace-routing"
import { described } from "./metadata"
import { t, type Language } from "../i18n"

const root = "/project"
const UpdatePayload = Schema.Struct({
  name: Schema.optional(Schema.String),
  icon: Schema.optional(Project.Info.fields.icon),
  commands: Schema.optional(Project.Info.fields.commands),
})

export const makeProjectApi = (language?: Language) =>
  HttpApi.make("project")
    .add(
      HttpApiGroup.make("project")
        .add(
          HttpApiEndpoint.get("list", root, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(Project.Info), t(language, "response_project_list")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "project.list",
              summary: t(language, "project_list"),
              description: t(language, "project_list_description"),
            }),
          ),
          HttpApiEndpoint.get("current", `${root}/current`, {
            query: WorkspaceRoutingQuery,
            success: described(Project.Info, t(language, "response_current_project")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "project.current",
              summary: t(language, "project_current"),
              description: t(language, "project_current_description"),
            }),
          ),
          HttpApiEndpoint.post("initGit", `${root}/git/init`, {
            query: WorkspaceRoutingQuery,
            success: described(Project.Info, t(language, "response_project_after_git_init")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "project.initGit",
              summary: t(language, "project_init_git"),
              description: t(language, "project_init_git_description"),
            }),
          ),
          HttpApiEndpoint.patch("update", `${root}/:projectID`, {
            params: { projectID: ProjectV2.ID },
            query: WorkspaceRoutingQuery,
            payload: UpdatePayload,
            success: described(Project.Info, t(language, "response_project_updated")),
            error: [HttpApiError.BadRequest, ProjectNotFoundError],
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "project.update",
              summary: t(language, "project_update"),
              description: t(language, "project_update_description"),
            }),
          ),
          HttpApiEndpoint.get("directories", `${root}/:projectID/directories`, {
            params: { projectID: ProjectV2.ID },
            query: WorkspaceRoutingQuery,
            success: described(ProjectV2.Directories, t(language, "response_project_directories")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "project.directories",
              summary: t(language, "project_directories"),
              description: t(language, "project_directories_description"),
            }),
          ),
        )
        .annotateMerge(
          OpenApi.annotations({
            title: "project",
            description: t(language, "project_routes"),
          }),
        )
        .middleware(InstanceContextMiddleware)
        .middleware(WorkspaceRoutingMiddleware)
        .middleware(Authorization),
    )
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "httpapi_title"),
        version: "0.0.1",
        description: t(language, "httpapi_title"),
      }),
    )

export const ProjectApi = makeProjectApi()
