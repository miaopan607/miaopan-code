import { AccountID, OrgID } from "@/account/schema"
import { MCP } from "@/mcp"

import { Session } from "@/session/session"
import { SessionID } from "@/session/schema"
import { Worktree } from "@/worktree"
import { NonNegativeInt } from "@miaopan-code/core/schema"
import { Schema } from "effect"
import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, HttpApiSchema, OpenApi } from "effect/unstable/httpapi"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import {
  WorkspaceRoutingMiddleware,
  WorkspaceRoutingQuery,
  WorkspaceRoutingQueryFields,
} from "../middleware/workspace-routing"
import { described } from "./metadata"
import { t, type Language } from "../i18n"
import { QueryBoolean } from "./query"
import { ProviderV2 } from "@miaopan-code/core/provider"
import { ModelV2 } from "@miaopan-code/core/model"

const ConsoleStateResponse = Schema.Struct({
  consoleManagedProviders: Schema.mutable(Schema.Array(Schema.String)),
  activeOrgName: Schema.optionalKey(Schema.String),
  switchableOrgCount: NonNegativeInt,
}).annotate({ identifier: "ConsoleState" })

const CapabilitiesResponse = Schema.Struct({
  backgroundSubagents: Schema.Boolean,
}).annotate({ identifier: "ExperimentalCapabilities" })

const ConsoleOrgOption = Schema.Struct({
  accountID: Schema.String,
  accountEmail: Schema.String,
  accountUrl: Schema.String,
  orgID: Schema.String,
  orgName: Schema.String,
  active: Schema.Boolean,
})

const ConsoleOrgList = Schema.Struct({
  orgs: Schema.Array(ConsoleOrgOption),
})

export const ConsoleSwitchPayload = Schema.Struct({
  accountID: AccountID,
  orgID: OrgID,
})

const ToolIDs = Schema.Array(Schema.String).annotate({ identifier: "ToolIDs" })
const ToolListItem = Schema.Struct({
  id: Schema.String,
  description: Schema.String,
  parameters: Schema.Unknown,
}).annotate({ identifier: "ToolListItem" })
const ToolList = Schema.Array(ToolListItem).annotate({ identifier: "ToolList" })
export const ToolListQuery = Schema.Struct({
  ...WorkspaceRoutingQueryFields,
  provider: ProviderV2.ID,
  model: ModelV2.ID,
})

const WorktreeList = Schema.Array(Schema.String)
const WorktreeErrorName = Schema.Union([
  Schema.Literal("WorktreeNotGitError"),
  Schema.Literal("WorktreeNameGenerationFailedError"),
  Schema.Literal("WorktreeCreateFailedError"),
  Schema.Literal("WorktreeStartCommandFailedError"),
  Schema.Literal("WorktreeRemoveFailedError"),
  Schema.Literal("WorktreeResetFailedError"),
  Schema.Literal("WorktreeListFailedError"),
])
export class WorktreeApiError extends Schema.ErrorClass<WorktreeApiError>("WorktreeError")(
  {
    name: WorktreeErrorName,
    data: Schema.Struct({ message: Schema.String }),
  },
  { httpApiStatus: 400 },
) {}
export const SessionListQuery = Schema.Struct({
  ...WorkspaceRoutingQueryFields,
  roots: Schema.optional(QueryBoolean),
  start: Schema.optional(Schema.NumberFromString),
  cursor: Schema.optional(Schema.NumberFromString),
  search: Schema.optional(Schema.String),
  limit: Schema.optional(Schema.NumberFromString),
  archived: Schema.optional(QueryBoolean),
})

export const ExperimentalPaths = {
  capabilities: "/experimental/capabilities",
  console: "/experimental/console",
  consoleOrgs: "/experimental/console/orgs",
  consoleSwitch: "/experimental/console/switch",
  tool: "/experimental/tool",
  toolIDs: "/experimental/tool/ids",
  worktree: "/experimental/worktree",
  worktreeReset: "/experimental/worktree/reset",
  session: "/experimental/session",
  sessionBackground: "/experimental/session/:sessionID/background",
  resource: "/experimental/resource",
} as const

export const makeExperimentalApi = (language?: Language) =>
  HttpApi.make("experimental")
    .add(
      HttpApiGroup.make("experimental")
        .add(
          HttpApiEndpoint.get("capabilities", ExperimentalPaths.capabilities, {
            query: WorkspaceRoutingQuery,
            success: described(CapabilitiesResponse, t(language, "response_experimental_capabilities")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "experimental.capabilities.get",
              summary: t(language, "experimental_capabilities"),
              description: t(language, "experimental_capabilities_description"),
            }),
          ),
          HttpApiEndpoint.get("console", ExperimentalPaths.console, {
            query: WorkspaceRoutingQuery,
            success: described(ConsoleStateResponse, t(language, "response_console_metadata")),
            error: HttpApiError.InternalServerError,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "experimental.console.get",
              summary: t(language, "console_metadata"),
              description: t(language, "console_metadata_description"),
            }),
          ),
          HttpApiEndpoint.get("consoleOrgs", ExperimentalPaths.consoleOrgs, {
            query: WorkspaceRoutingQuery,
            success: described(ConsoleOrgList, t(language, "response_console_orgs")),
            error: HttpApiError.InternalServerError,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "experimental.console.listOrgs",
              summary: t(language, "console_orgs"),
              description: t(language, "console_orgs_description"),
            }),
          ),
          HttpApiEndpoint.post("consoleSwitch", ExperimentalPaths.consoleSwitch, {
            query: WorkspaceRoutingQuery,
            payload: ConsoleSwitchPayload,
            success: described(Schema.Boolean, t(language, "response_console_switch")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "experimental.console.switchOrg",
              summary: t(language, "console_switch"),
              description: t(language, "console_switch_description"),
            }),
          ),
          HttpApiEndpoint.get("tool", ExperimentalPaths.tool, {
            query: ToolListQuery,
            success: described(ToolList, t(language, "response_tools")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tool.list",
              summary: t(language, "experimental_tools"),
              description: t(language, "experimental_tools_description"),
            }),
          ),
          HttpApiEndpoint.get("toolIDs", ExperimentalPaths.toolIDs, {
            query: WorkspaceRoutingQuery,
            success: described(ToolIDs, t(language, "response_tool_ids")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "tool.ids",
              summary: t(language, "experimental_tool_ids"),
              description: t(language, "experimental_tool_ids_description"),
            }),
          ),
          HttpApiEndpoint.get("worktree", ExperimentalPaths.worktree, {
            query: WorkspaceRoutingQuery,
            success: described(WorktreeList, t(language, "response_worktree_directories")),
            error: WorktreeApiError,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "worktree.list",
              summary: t(language, "experimental_worktrees"),
              description: t(language, "experimental_worktrees_description"),
            }),
          ),
          HttpApiEndpoint.post("worktreeCreate", ExperimentalPaths.worktree, {
            disableCodecs: true,
            query: WorkspaceRoutingQuery,
            payload: [HttpApiSchema.NoContent, Worktree.CreateInput],
            success: described(Worktree.Info, t(language, "response_worktree_created")),
            error: WorktreeApiError,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "worktree.create",
              summary: t(language, "experimental_worktree_create"),
              description: t(language, "experimental_worktree_create_description"),
            }),
          ),
          HttpApiEndpoint.delete("worktreeRemove", ExperimentalPaths.worktree, {
            query: WorkspaceRoutingQuery,
            payload: Worktree.RemoveInput,
            success: described(Schema.Boolean, t(language, "response_worktree_removed")),
            error: WorktreeApiError,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "worktree.remove",
              summary: t(language, "experimental_worktree_remove"),
              description: t(language, "experimental_worktree_remove_description"),
            }),
          ),
          HttpApiEndpoint.post("worktreeReset", ExperimentalPaths.worktreeReset, {
            query: WorkspaceRoutingQuery,
            payload: Worktree.ResetInput,
            success: described(Schema.Boolean, t(language, "response_worktree_reset")),
            error: WorktreeApiError,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "worktree.reset",
              summary: t(language, "experimental_worktree_reset"),
              description: t(language, "experimental_worktree_reset_description"),
            }),
          ),
          HttpApiEndpoint.get("session", ExperimentalPaths.session, {
            query: SessionListQuery,
            success: described(Schema.Array(Session.GlobalInfo), t(language, "response_session_list")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "experimental.session.list",
              summary: t(language, "experimental_sessions"),
              description: t(language, "experimental_sessions_description"),
            }),
          ),
          HttpApiEndpoint.post("sessionBackground", ExperimentalPaths.sessionBackground, {
            params: { sessionID: SessionID },
            query: WorkspaceRoutingQuery,
            success: described(Schema.Boolean, t(language, "response_backgrounded_subagents")),
            error: HttpApiError.BadRequest,
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "experimental.session.background",
              summary: t(language, "experimental_background"),
              description: t(language, "experimental_background_description"),
            }),
          ),
          HttpApiEndpoint.get("resource", ExperimentalPaths.resource, {
            query: WorkspaceRoutingQuery,
            success: described(Schema.Record(Schema.String, MCP.Resource), t(language, "response_mcp_resources")),
          }).annotateMerge(
            OpenApi.annotations({
              identifier: "experimental.resource.list",
              summary: t(language, "experimental_resources"),
              description: t(language, "experimental_resources_description"),
            }),
          ),
        )
        .annotateMerge(
          OpenApi.annotations({
            title: "experimental",
            description: t(language, "experimental_routes"),
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

export const ExperimentalApi = makeExperimentalApi()
