export * as Project from "./project"

import { Schema } from "effect"
import { define, inventory } from "./event"
import { NonNegativeInt, optional } from "./schema"
import { ProjectID } from "./project-id"
import { t, type Language } from "./i18n"

export const ID = ProjectID
export type ID = typeof ID.Type

export const Vcs = Schema.Literal("git").annotate({ identifier: "Project.Vcs" })
export const Icon = Schema.Struct({
  url: optional(Schema.String),
  override: optional(Schema.String),
  color: optional(Schema.String),
}).annotate({ identifier: "Project.Icon" })
export interface Icon extends Schema.Schema.Type<typeof Icon> {}
export const makeCommands = (language?: Language) =>
  Schema.Struct({
    start: optional(Schema.String.annotate({ description: t(language, "project_startup") })),
  }).annotate({ identifier: "Project.Commands" })
export const Commands = makeCommands()
export interface Commands extends Schema.Schema.Type<typeof Commands> {}
export const Time = Schema.Struct({
  created: NonNegativeInt,
  updated: NonNegativeInt,
  initialized: optional(NonNegativeInt),
}).annotate({ identifier: "Project.Time" })
export interface Time extends Schema.Schema.Type<typeof Time> {}

export const makeInfo = (language?: Language) =>
  Schema.Struct({
    id: ID,
    worktree: Schema.String,
    vcs: optional(Vcs),
    name: optional(Schema.String),
    icon: optional(Icon),
    commands: optional(makeCommands(language)),
    time: Time,
    sandboxes: Schema.Array(Schema.String),
  }).annotate({ identifier: "Project" })
export const Info = makeInfo()
export interface Info extends Schema.Schema.Type<typeof Info> {}

const Updated = define({ type: "project.updated", schema: Info.fields })
export const Event = { Updated, Definitions: inventory(Updated) }
