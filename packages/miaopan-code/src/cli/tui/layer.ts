import { run as runTui, type TuiInput } from "@miaopan-code/tui"
import { Global } from "@miaopan-code/core/global"
import { AppNodeBuilder } from "@miaopan-code/core/effect/app-node-builder"
import { Effect } from "effect"

export function run(input: TuiInput) {
  return runTui(input).pipe(Effect.provide(AppNodeBuilder.build(Global.node)))
}
