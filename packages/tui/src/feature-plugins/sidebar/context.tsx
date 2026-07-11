import type { AssistantMessage } from "@miaopan/sdk/v2"
import type { TuiPlugin, TuiPluginApi } from "@miaopan/plugin/tui"
import type { BuiltinTuiPlugin } from "../builtins"
import { createMemo } from "solid-js"
import { t } from "@miaopan-code/core/i18n"
import { Locale } from "../../util/locale"

const id = "internal:sidebar-context"
const compactTokens = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
})

export function SidebarContextView(props: { api: TuiPluginApi; session_id: string }) {
  const tr = (key: Parameters<typeof t>[1]) => t(Locale.language(), key)
  const theme = () => props.api.theme.current
  const msg = createMemo(() => props.api.state.session.messages(props.session_id))
  const session = createMemo(() => props.api.state.session.get(props.session_id))
  const cost = createMemo(() => session()?.cost ?? 0)

  const state = createMemo(() => {
    const last = msg().findLast((item): item is AssistantMessage => item.role === "assistant" && item.tokens.output > 0)
    if (!last) {
      return {
        tokens: 0,
        context: null,
        percent: null,
      }
    }

    const tokens =
      last.tokens.input + last.tokens.output + last.tokens.reasoning + last.tokens.cache.read + last.tokens.cache.write
    const model = props.api.state.provider.find((item) => item.id === last.providerID)?.models[last.modelID]
    const context = model?.limit.context && model.limit.context > 0 ? model.limit.context : null
    return {
      tokens,
      context,
      percent: context ? Math.round((tokens / context) * 100) : null,
    }
  })

  return (
    <box>
      <text fg={theme().text}>
        <b>{tr("sidebar.context")}</b>
      </text>
      <text fg={theme().textMuted}>{formatTokens(state().tokens, state().context)}</text>
      <text fg={theme().textMuted}>
        {state().percent ?? 0}% {tr("sidebar.used")}
      </text>
      <text fg={theme().textMuted}>
        {Locale.currency(cost())} {tr("sidebar.spent")}
      </text>
    </box>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    order: 100,
    slots: {
      sidebar_content(_ctx, props) {
        return <SidebarContextView api={api} session_id={props.session_id} />
      },
    },
  })
}

const plugin: BuiltinTuiPlugin = {
  id,
  tui,
}

export default plugin

export function formatTokens(tokens: number, context?: number | null) {
  const used = compactTokens.format(tokens)
  if (!context) return used
  return `${used} / ${compactTokens.format(context)}`
}
