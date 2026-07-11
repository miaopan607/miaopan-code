import { Location } from "@miaopan-code/core/location"
import { ProjectCopy } from "@miaopan-code/core/project/copy"
import { Git } from "@miaopan-code/core/git"
import { Effect } from "effect"
import { HttpApiBuilder, HttpApiSchema } from "effect/unstable/httpapi"
import { Api } from "../api"
import { ProjectCopyError } from "@miaopan-code/protocol/groups/project-copy"
import { t, type Language } from "@miaopan-code/core/i18n"
import { requestLanguage } from "../i18n"

export const ProjectCopyHandler = HttpApiBuilder.group(Api, "server.projectCopy", (handlers) =>
  Effect.succeed(
    handlers
      .handle("projectCopy.create", (ctx) =>
        Effect.gen(function* () {
          const copies = yield* ProjectCopy.Service
          const location = yield* Location.Service
          return yield* badRequest(
            copies.create({
              ...ctx.payload,
              projectID: ctx.params.projectID,
              sourceDirectory: location.project.directory,
            }),
          )
        }),
      )
      .handle("projectCopy.remove", (ctx) =>
        ProjectCopy.Service.use((copies) =>
          badRequest(copies.remove({ ...ctx.payload, projectID: ctx.params.projectID })).pipe(
            Effect.as(HttpApiSchema.NoContent.make()),
          ),
        ),
      )
      .handle("projectCopy.refresh", (ctx) =>
        ProjectCopy.Service.use((copies) =>
          badRequest(copies.refresh({ projectID: ctx.params.projectID })).pipe(
            Effect.as(HttpApiSchema.NoContent.make()),
          ),
        ),
      ),
  ),
)

function badRequest<A, R>(effect: Effect.Effect<A, ProjectCopy.Error, R>) {
  return Effect.gen(function* () {
    const language = yield* requestLanguage()
    return yield* effect.pipe(
      Effect.mapError(
        (error) =>
          new ProjectCopyError({
            name: "ProjectCopyError",
            data: {
              message: message(error, language),
              forceRequired: error instanceof Git.WorktreeError ? error.forceRequired : undefined,
            },
          }),
      ),
    )
  })
}

function message(error: ProjectCopy.Error, language: Language) {
  if (error instanceof ProjectCopy.SourceDirectoryNotFoundError)
    return t(language, "error.project_copy_source_not_found", { directory: error.directory })
  if (error instanceof ProjectCopy.DestinationExistsError)
    return t(language, "error.project_copy_destination_exists", { directory: error.directory })
  if (error instanceof ProjectCopy.DirectoryUnavailableError)
    return t(language, "error.project_copy_directory_unavailable", { directory: error.directory })
  if (error instanceof ProjectCopy.InvalidDirectoryError)
    return t(language, "error.project_copy_invalid_directory", { directory: error.directory })
  if (error instanceof ProjectCopy.StrategyUnavailableError)
    return t(language, "error.project_copy_strategy_unavailable", { strategy: error.strategy })
  return error.message
}
