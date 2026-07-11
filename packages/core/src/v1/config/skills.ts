export * as ConfigSkillsV1 from "./skills"

import { Schema } from "effect"
import { zh } from "../../i18n"

export const Info = Schema.Struct({
  paths: Schema.optional(Schema.Array(Schema.String)).annotate({
    description: zh("config.v1.skill_paths"),
  }),
  urls: Schema.optional(Schema.Array(Schema.String)).annotate({
    description: zh("config.v1.skill_urls"),
  }),
})
export type Info = Schema.Schema.Type<typeof Info>
