import { Schema } from "effect"
import { HttpApi } from "effect/unstable/httpapi"
import { EventV2 } from "@miaopan-code/core/event"
import { EventManifest } from "@/event-manifest"
import { Credential } from "@miaopan-code/core/credential"
import { Integration } from "@miaopan-code/core/integration"
import { SkillV2 } from "@miaopan-code/core/skill"
import { InstanceDisposed } from "@/server/event"
import { Question } from "@/question"
import { ConfigApi, makeConfigApi } from "./groups/config"
import { ControlApi, makeControlApi } from "./groups/control"
import { ControlPlaneApi, makeControlPlaneApi } from "./groups/control-plane"
import { EventApi, makeEventApi } from "./groups/event"
import { ExperimentalApi, makeExperimentalApi } from "./groups/experimental"
import { FileApi, makeFileApi } from "./groups/file"
import { InstanceApi, makeInstanceApi } from "./groups/instance"
import { McpApi, makeMcpApi } from "./groups/mcp"
import { PermissionApi, makePermissionApi } from "./groups/permission"
import { ProjectApi, makeProjectApi } from "./groups/project"
import { ProjectCopyApi, makeProjectCopyApi } from "./groups/project-copy"
import { ProviderApi, makeProviderApi } from "./groups/provider"
import { PtyApi, PtyConnectApi, makePtyApi, makePtyConnectApi } from "./groups/pty"
import { QuestionApi, makeQuestionApi } from "./groups/question"
import { SessionApi, makeSessionApi } from "./groups/session"
import { SyncApi, makeSyncApi } from "./groups/sync"
import { TuiApi, makeTuiApi } from "./groups/tui"
import { WorkspaceApi, makeWorkspaceApi } from "./groups/workspace"
import { makeApi } from "@miaopan-code/protocol/api"
import { LocationMiddleware } from "@miaopan-code/server/location"
import { SessionLocationMiddleware } from "@miaopan-code/server/middleware/session-location"
import { GlobalApi, makeGlobalApi } from "./groups/global"
import { Authorization } from "./middleware/authorization"
import { SchemaErrorMiddleware } from "./middleware/schema-error"
import type { Language } from "./i18n"

const EventSchema = Schema.Union([
  ...EventManifest.Latest.values()
    .map((definition) =>
      Schema.Struct({
        id: EventV2.ID,
        type: Schema.Literal(definition.type),
        properties: definition.data,
      }).annotate({ identifier: `Event.${definition.type}` }),
    )
    .toArray(),
  InstanceDisposed,
]).annotate({ identifier: "Event" })

export const makeServerApi = (language?: Language) =>
  makeApi({
    definitions: EventManifest.Latest.values().toArray(),
    locationMiddleware: LocationMiddleware,
    sessionLocationMiddleware: SessionLocationMiddleware,
    language,
  })

export const ServerApi = makeServerApi()

export const RootHttpApi = HttpApi.make("miaopanCode-root")
  .addHttpApi(ControlApi)
  .addHttpApi(ControlPlaneApi)
  .addHttpApi(GlobalApi)
  .middleware(SchemaErrorMiddleware)
  .middleware(Authorization)

export const makeRootHttpApi = (language?: Language) =>
  HttpApi.make("miaopanCode-root")
    .addHttpApi(makeControlApi(language))
    .addHttpApi(makeControlPlaneApi(language))
    .addHttpApi(makeGlobalApi(language))
    .middleware(SchemaErrorMiddleware)
    .middleware(Authorization)

export const InstanceHttpApi = HttpApi.make("miaopanCode-instance")
  .addHttpApi(ConfigApi)
  .addHttpApi(ExperimentalApi)
  .addHttpApi(FileApi)
  .addHttpApi(InstanceApi)
  .addHttpApi(McpApi)
  .addHttpApi(ProjectApi)
  .addHttpApi(ProjectCopyApi)
  .addHttpApi(PtyApi)
  .addHttpApi(QuestionApi)
  .addHttpApi(PermissionApi)
  .addHttpApi(ProviderApi)
  .addHttpApi(SessionApi)
  .addHttpApi(SyncApi)
  .addHttpApi(TuiApi)
  .addHttpApi(WorkspaceApi)
  .middleware(SchemaErrorMiddleware)

export const makeInstanceHttpApi = (language?: Language) =>
  HttpApi.make("miaopanCode-instance")
    .addHttpApi(makeConfigApi(language))
    .addHttpApi(makeExperimentalApi(language))
    .addHttpApi(makeFileApi(language))
    .addHttpApi(makeInstanceApi(language))
    .addHttpApi(makeMcpApi(language))
    .addHttpApi(makeProjectApi(language))
    .addHttpApi(makeProjectCopyApi(language))
    .addHttpApi(makePtyApi(language))
    .addHttpApi(makeQuestionApi(language))
    .addHttpApi(makePermissionApi(language))
    .addHttpApi(makeProviderApi(language))
    .addHttpApi(makeSessionApi(language))
    .addHttpApi(makeSyncApi(language))
    .addHttpApi(makeTuiApi(language))
    .addHttpApi(makeWorkspaceApi(language))
    .middleware(SchemaErrorMiddleware)

export const MiaopanCodeHttpApi = HttpApi.make("miaopan-code")
  .addHttpApi(RootHttpApi)
  .addHttpApi(EventApi)
  .addHttpApi(InstanceHttpApi)
  .addHttpApi(ServerApi)
  .addHttpApi(PtyConnectApi)
  .annotate(HttpApi.AdditionalSchemas, [
    EventSchema,
    Question.Replied,
    Question.Rejected,
    Credential.Value,
    Integration.Inputs,
    Integration.Method,
    Integration.Ref,
    SkillV2.Source,
  ])

export const makeMiaopanCodeHttpApi = (language?: Language) =>
  HttpApi.make("miaopan-code")
    .addHttpApi(makeRootHttpApi(language))
    .addHttpApi(makeEventApi(language))
    .addHttpApi(makeInstanceHttpApi(language))
    .addHttpApi(makeServerApi(language))
    .addHttpApi(makePtyConnectApi(language))
    .annotate(HttpApi.AdditionalSchemas, [
      EventSchema,
      Question.Replied,
      Question.Rejected,
      Credential.Value,
      Integration.Inputs,
      Integration.Method,
      Integration.Ref,
      SkillV2.Source,
    ])

export type RootHttpApiType = typeof RootHttpApi
export type InstanceHttpApiType = typeof InstanceHttpApi
