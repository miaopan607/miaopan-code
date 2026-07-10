import { Context } from "effect"
import type { InstanceContext } from "@/project/instance-context"
import type { WorkspaceV2 } from "@miaopan-code/core/workspace"

export const InstanceRef = Context.Reference<InstanceContext | undefined>("~miaopanCode/InstanceRef", {
  defaultValue: () => undefined,
})

export const WorkspaceRef = Context.Reference<WorkspaceV2.ID | undefined>("~miaopanCode/WorkspaceRef", {
  defaultValue: () => undefined,
})
