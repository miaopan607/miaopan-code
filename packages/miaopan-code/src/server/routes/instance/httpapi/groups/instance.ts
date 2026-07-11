import { Agent } from "@/agent/agent"
import { Command } from "@/command"
import { Format } from "@/format"
import { LSP } from "@/lsp/lsp"
import { Vcs } from "@/project/vcs"
import { Skill } from "@/skill"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import {
  WorkspaceRoutingMiddleware,
  WorkspaceRoutingQuery,
  WorkspaceRoutingQueryFields,
} from "../middleware/workspace-routing"
import { described } from "./metadata"
import { t, type Language } from "../i18n"

const PathInfo = Schema.Struct({
  home: Schema.String,
  state: Schema.String,
  config: Schema.String,
  worktree: Schema.String,
  directory: Schema.String,
}).annotate({ identifier: "Path" })

export const VcsDiffQuery = Schema.Struct({
  ...WorkspaceRoutingQueryFields,
  mode: Vcs.Mode,
  context: Schema.optional(Schema.NumberFromString.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0))),
})

export class ApiVcsApplyError extends Schema.ErrorClass<ApiVcsApplyError>("VcsApplyError")(
  {
    name: Schema.Literal("VcsApplyError"),
    data: Schema.Struct({
      message: Schema.String,
      reason: Schema.Literals(["non-git", "not-clean"]),
    }),
  },
  { httpApiStatus: 400 },
) {}

export const InstancePaths = {
  dispose: "/instance/dispose",
  path: "/path",
  vcs: "/vcs",
  vcsStatus: "/vcs/status",
  vcsDiff: "/vcs/diff",
  vcsDiffRaw: "/vcs/diff/raw",
  vcsApply: "/vcs/apply",
  command: "/command",
  agent: "/agent",
  skill: "/skill",
  lsp: "/lsp",
  formatter: "/formatter",
} as const

export const makeInstanceApi = (language?: Language) =>
  HttpApi.make("instance")
    .add(
      HttpApiGroup.make("instance")
        .add(
          HttpApiEndpoint.post("dispose", InstancePaths.dispose, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, t(language, "response_instance_disposed")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "instance.dispose",
              summary: t(language, "instance_dispose"),
              description: t(language, "instance_dispose_description"),
            }),
          ),
          HttpApiEndpoint.get("path", InstancePaths.path, {
            query: WorkspaceRoutingQuery,
            success: PathInfo,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "path.get",
              summary: t(language, "instance_paths"),
              description: t(language, "instance_paths_description"),
            }),
          ),
          HttpApiEndpoint.get("vcs", InstancePaths.vcs, {
            query: WorkspaceRoutingQuery,
            success: described(Vcs.Info, t(language, "response_vcs_info")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "vcs.get",
              summary: t(language, "instance_vcs_info"),
              description: t(language, "instance_vcs_info_description"),
            }),
          ),
          HttpApiEndpoint.get("vcsStatus", InstancePaths.vcsStatus, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(Vcs.FileStatus), t(language, "response_vcs_status")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "vcs.status",
              summary: t(language, "instance_vcs_status"),
              description: t(language, "instance_vcs_status_description"),
            }),
          ),
          HttpApiEndpoint.get("vcsDiff", InstancePaths.vcsDiff, {
            query: VcsDiffQuery,
            success: described(Schema.Array(Vcs.FileDiff), t(language, "response_vcs_diff")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "vcs.diff",
              summary: t(language, "instance_vcs_diff"),
              description: t(language, "instance_vcs_diff_description"),
            }),
          ),
          HttpApiEndpoint.get("vcsDiffRaw", InstancePaths.vcsDiffRaw, {
            query: WorkspaceRoutingQuery,
            success: described(
              Schema.String.pipe(HttpApiSchema.asText({ contentType: "text/x-diff; charset=utf-8" })),
              t(language, "response_vcs_raw_diff"),
            ),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "vcs.diff.raw",
              summary: t(language, "instance_vcs_raw_diff"),
              description: t(language, "instance_vcs_raw_diff_description"),
            }),
          ),
          HttpApiEndpoint.post("vcsApply", InstancePaths.vcsApply, {
            query: WorkspaceRoutingQuery,
            payload: Vcs.ApplyInput,
            success: described(Vcs.ApplyResult, t(language, "response_vcs_patch_applied")),
            error: ApiVcsApplyError,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "vcs.apply",
              summary: t(language, "instance_vcs_apply"),
              description: t(language, "instance_vcs_apply_description"),
            }),
          ),
          HttpApiEndpoint.get("command", InstancePaths.command, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(Command.Info), t(language, "response_command_list")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "command.list",
              summary: t(language, "instance_commands"),
              description: t(language, "instance_commands_description"),
            }),
          ),
          HttpApiEndpoint.get("agent", InstancePaths.agent, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(Agent.Info), t(language, "response_agent_list")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "app.agents",
              summary: t(language, "instance_agents"),
              description: t(language, "instance_agents_description"),
            }),
          ),
          HttpApiEndpoint.get("skill", InstancePaths.skill, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(Skill.Info), t(language, "response_skill_list")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "app.skills",
              summary: t(language, "instance_skills"),
              description: t(language, "instance_skills_description"),
            }),
          ),
          HttpApiEndpoint.get("lsp", InstancePaths.lsp, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(LSP.Status), t(language, "response_lsp_status")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "lsp.status",
              summary: t(language, "instance_lsp_status"),
              description: t(language, "instance_lsp_status"),
            }),
          ),
          HttpApiEndpoint.get("formatter", InstancePaths.formatter, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Array(Format.Status), t(language, "response_formatter_status")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "formatter.status",
              summary: t(language, "instance_formatter_status"),
              description: t(language, "instance_formatter_status"),
            }),
          ),
        )
        .annotateMerge(
          OpenApi.annotations({
            title: "instance",
            description: t(language, "instance_routes"),
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

export const InstanceApi = makeInstanceApi()
