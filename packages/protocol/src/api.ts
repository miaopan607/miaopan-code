import { Context } from "effect"
import { t, type Language } from "./i18n"
import { HttpApi, HttpApiGroup, HttpApiMiddleware, OpenApi } from "effect/unstable/httpapi"
import { SchemaErrorMiddleware } from "./middleware/schema-error"
import { makeMessageGroup } from "./groups/message"
import { makeModelGroup } from "./groups/model"
import { makeProviderGroup } from "./groups/provider"
import { makeSessionGroup } from "./groups/session"
import { makePermissionGroup } from "./groups/permission"
import { makeFileSystemGroup } from "./groups/fs"
import { makeCommandGroup } from "./groups/command"
import { makeSkillGroup } from "./groups/skill"
import { makeEventGroup } from "./groups/event"
import type { Definition } from "@miaopan-code/schema/event"
import { EventManifest } from "@miaopan-code/schema/event-manifest"
import { makeAgentGroup } from "./groups/agent"
import { makeHealthGroup } from "./groups/health"
import { makePtyGroup } from "./groups/pty"
import { makeQuestionGroup } from "./groups/question"
import { makeReferenceGroup } from "./groups/reference"
import { Authorization } from "./middleware/authorization"
import { makeLocationGroup } from "./groups/location"
import { makeIntegrationGroup } from "./groups/integration"
import { makeCredentialGroup } from "./groups/credential"
import { makeProjectCopyGroup } from "./groups/project-copy"

// Protocol owns middleware placement, while Server injects concrete keys so Core service identities stay downstream.
const makeApiFromGroup = <
  const Group extends HttpApiGroup.Any,
  LocationId extends HttpApiMiddleware.AnyId,
  LocationService,
  SessionLocationId extends HttpApiMiddleware.AnyId,
  SessionLocationService,
>(
  eventGroup: Group,
  locationMiddleware: Context.Key<LocationId, LocationService>,
  sessionLocationMiddleware: Context.Key<SessionLocationId, SessionLocationService>,
  language?: Language,
) =>
  HttpApi.make("server")
    .add(makeHealthGroup(language))
    .add(makeLocationGroup(language).middleware(locationMiddleware))
    .add(makeAgentGroup(language).middleware(locationMiddleware))
    .add(makeSessionGroup(sessionLocationMiddleware, language))
    .add(makeMessageGroup(language).middleware(sessionLocationMiddleware))
    .add(makeModelGroup(language).middleware(locationMiddleware))
    .add(makeProviderGroup(language).middleware(locationMiddleware))
    .add(makeIntegrationGroup(language).middleware(locationMiddleware))
    .add(makeCredentialGroup(language).middleware(locationMiddleware))
    .add(makePermissionGroup(locationMiddleware, sessionLocationMiddleware, language))
    .add(makeFileSystemGroup(language).middleware(locationMiddleware))
    .add(makeCommandGroup(language).middleware(locationMiddleware))
    .add(makeSkillGroup(language).middleware(locationMiddleware))
    .add(eventGroup)
    .add(makePtyGroup(language).middleware(locationMiddleware))
    .add(makeQuestionGroup(locationMiddleware, sessionLocationMiddleware, language))
    .add(makeReferenceGroup(language).middleware(locationMiddleware))
    .add(makeProjectCopyGroup(language).middleware(locationMiddleware))
    .annotateMerge(
      OpenApi.annotations({
        title: t(language, "api_title"),
        version: "0.0.1",
        description: t(language, "api_description"),
      }),
    )
    .middleware(Authorization)
    .middleware(SchemaErrorMiddleware)

export const makeApi = <
  LocationId extends HttpApiMiddleware.AnyId,
  LocationService,
  SessionLocationId extends HttpApiMiddleware.AnyId,
  SessionLocationService,
>(options: {
  readonly definitions: ReadonlyArray<Definition>
  readonly locationMiddleware: Context.Key<LocationId, LocationService>
  readonly sessionLocationMiddleware: Context.Key<SessionLocationId, SessionLocationService>
  readonly language?: Language
}) =>
  makeApiFromGroup(
    makeEventGroup(options.definitions, options.language),
    options.locationMiddleware,
    options.sessionLocationMiddleware,
    options.language,
  )

export const makeDefaultApi = <
  LocationId extends HttpApiMiddleware.AnyId,
  LocationService,
  SessionLocationId extends HttpApiMiddleware.AnyId,
  SessionLocationService,
>(options: {
  readonly locationMiddleware: Context.Key<LocationId, LocationService>
  readonly sessionLocationMiddleware: Context.Key<SessionLocationId, SessionLocationService>
  readonly language?: Language
}) =>
  makeApiFromGroup(
    makeEventGroup(EventManifest.ServerDefinitions, options.language),
    options.locationMiddleware,
    options.sessionLocationMiddleware,
    options.language,
  )
