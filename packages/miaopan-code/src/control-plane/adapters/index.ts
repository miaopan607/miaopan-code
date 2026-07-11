import type { ProjectV2 } from "@miaopan-code/core/project"
import type { WorkspaceAdapter, WorkspaceAdapterEntry } from "../types"
import { makeWorktreeAdapter } from "./worktree"
import { t, type Language } from "@miaopan-code/core/i18n"

const builtins = (language?: Language): Record<string, WorkspaceAdapter> => ({
  worktree: makeWorktreeAdapter(language),
})

const state = new Map<ProjectV2.ID, Map<string, WorkspaceAdapter>>()

export function getAdapter(projectID: ProjectV2.ID, type: string, language?: Language): WorkspaceAdapter {
  const custom = state.get(projectID)?.get(type)
  if (custom) return custom

  const builtin = builtins(language)[type]
  if (builtin) return builtin

  throw new Error(t(language, "error.workspace_adapter_unknown", { type }))
}

export function listAdapters(projectID: ProjectV2.ID, language?: Language): WorkspaceAdapterEntry[] {
  return registeredAdapters(projectID, language).map(([type, adapter]) => ({
    type,
    name: adapter.name,
    description: adapter.description,
  }))
}

export function registeredAdapters(projectID: ProjectV2.ID, language?: Language): [string, WorkspaceAdapter][] {
  const adapters = new Map(Object.entries(builtins(language)))
  for (const [type, adapter] of state.get(projectID)?.entries() ?? []) adapters.set(type, adapter)
  return [...adapters.entries()]
}

// Plugins can be loaded per-project so we need to scope them. If you
// want to install a global one pass `ProjectV2.ID.global`
export function registerAdapter(projectID: ProjectV2.ID, type: string, adapter: WorkspaceAdapter) {
  const adapters = state.get(projectID) ?? new Map<string, WorkspaceAdapter>()
  adapters.set(type, adapter)
  state.set(projectID, adapters)
}
