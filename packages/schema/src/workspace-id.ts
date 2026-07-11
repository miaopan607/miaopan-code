import { Schema } from "effect"
import { ascending } from "./identifier"
import { statics } from "./schema"
import { t, type Language } from "./i18n"

export const makeWorkspaceID = (language?: Language) =>
  Schema.String.check(Schema.isStartsWith("wrk")).pipe(
    Schema.brand("WorkspaceV2.ID"),
    statics((schema) => {
      const create = () => schema.make("wrk_" + ascending())
      return {
        ascending: (id?: string) => {
          if (!id) return create()
          if (!id.startsWith("wrk")) throw new Error(t(language, "workspace_id_prefix", { id }))
          return schema.make(id)
        },
        create,
      }
    }),
  )
export const WorkspaceID = makeWorkspaceID()
export type WorkspaceID = typeof WorkspaceID.Type
