import {
  batch,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  on,
  onCleanup,
  onMount,
  Show,
  Switch,
  untrack,
  useContext,
} from "solid-js"
import path from "node:path"
import { mkdir, writeFile } from "node:fs/promises"
import { useRoute, useRouteData } from "../../context/route"
import { useProject } from "../../context/project"
import { useSync } from "../../context/sync"
import { useEvent } from "../../context/event"
import { SplitBorder } from "../../ui/border"
import { useTuiPaths, useTuiTerminalEnvironment } from "../../context/runtime"
import { Spinner } from "../../component/spinner"
import { createSyntaxStyleMemo, generateSubtleSyntax, selectedForeground, useTheme } from "../../context/theme"
import { BoxRenderable, ScrollBoxRenderable, addDefaultParsers, TextAttributes, RGBA } from "@opentui/core"
import { CodexStatus, Prompt, type PromptRef } from "../../component/prompt"
import type {
  AssistantMessage,
  Part,
  Provider,
  ToolPart,
  UserMessage,
  TextPart,
  PlanPart as PlanPartData,
  QuestionRequest,
  ReasoningPart,
  SessionStatus,
} from "@miaopan/sdk/v2"
import { useLocal } from "../../context/local"
import { Locale } from "../../util/locale"
import { builtinToolDisplayName, t } from "@miaopan-code/core/i18n"
import { webSearchProviderLabel } from "../../util/tool-display"
import { useRenderer, useTerminalDimensions, type JSX } from "@opentui/solid"
import { useSDK } from "../../context/sdk"
import { useEditorContext } from "../../context/editor"
import { useI18n } from "../../context/i18n"
import { openEditor } from "../../editor"
import { useDialog } from "../../ui/dialog"
import { DialogAlert } from "../../ui/dialog-alert"
import { DialogSelect } from "../../ui/dialog-select"
import { TodoItem } from "../../component/todo-item"
import { DialogMessage } from "./dialog-message"
import { DialogPlanImplementation, planImplementationOptions } from "./dialog-plan-implementation"
import type { PromptInfo } from "../../component/prompt/history"
import { DialogConfirm } from "../../ui/dialog-confirm"
import { DialogTimeline } from "./dialog-timeline"
import { DialogForkFromTimeline } from "./dialog-fork-from-timeline"
import { DialogSessionRename } from "../../component/dialog-session-rename"
import { Sidebar } from "./sidebar"
import { SubagentFooter } from "./subagent-footer.tsx"
import { filetype } from "../../util/filetype"
import parsers from "../../parsers-config"
import { errorMessage } from "../../util/error"
import { Toast, useToast } from "../../ui/toast"
import { useKV } from "../../context/kv.tsx"
import stripAnsi from "strip-ansi"
import { usePromptRef } from "../../context/prompt"
import { useEpilogue } from "../../context/epilogue"
import { normalizePath } from "../../util/path"
import { PermissionPrompt } from "./permission"
import { QuestionPrompt } from "./question"
import { splitQuestionAnswer } from "./question.shared"
import { DialogExportOptions } from "../../ui/dialog-export-options"
import * as Model from "../../util/model"
import { formatTranscript } from "../../util/transcript"
import { sessionEpilogue } from "../../util/presentation"
import { setPreLayoutSiblingMargin } from "../../util/layout"
import { useTuiConfig } from "../../config"
import { useClipboard } from "../../context/clipboard"
import { reasoningSummary, useThinkingMode, type ThinkingMode } from "../../context/thinking"
import { getScrollAcceleration } from "../../util/scroll"
import { collapseToolOutput, collapseToolText } from "../../util/collapse-tool-output"
import { usePluginRuntime } from "../../plugin/runtime"
import { DialogRetryAction } from "../../component/dialog-retry-action"
import { getRevertDiffFiles } from "../../util/revert-diff"
import { MIAOPAN_CODE_BASE_MODE, useBindings, useCommandShortcut, useMiaopanCodeKeymap } from "../../keymap"
import { usePathFormatter } from "../../context/path-format"
import { LocationProvider } from "../../context/location"
import { stripPromptPartIDs } from "../../prompt/part"
import { formatDuration } from "../../util/format"

addDefaultParsers(parsers.parsers)

const GO_UPSELL_FREE_TIER_LAST_SEEN_AT = "go_upsell_last_seen_at"
const GO_UPSELL_FREE_TIER_DONT_SHOW = "go_upsell_dont_show"
const GO_UPSELL_ACCOUNT_RATE_LIMIT_LAST_SEEN_AT = "go_upsell_account_rate_limit_last_seen_at"
const GO_UPSELL_ACCOUNT_RATE_LIMIT_DONT_SHOW = "go_upsell_account_rate_limit_dont_show"
const GO_UPSELL_WINDOW = 86_400_000 // 24 hrs
const GO_UPSELL_PROVIDERS = new Set(["opencode", "opencode-go"])

export const alwaysSeparate = new WeakSet<BoxRenderable>()

type Plan = Pick<PlanPartData, "id" | "messageID" | "text">

export function isPlanSessionAvailable(input: { status: SessionStatus | undefined; blocked: boolean }) {
  return !input.blocked && (input.status === undefined || input.status.type === "idle")
}

export function implementPlanInCurrentContext(input: {
  plan: { messageID: string } | undefined
  prompt: () => Pick<PromptRef, "set" | "submit"> | undefined
  finish: (messageID: string) => void
  build: () => void
  message: string
  defer?: (callback: () => void) => void
}) {
  if (!input.plan) return
  input.finish(input.plan.messageID)

  const submit = () => {
    const prompt = input.prompt()
    if (!prompt) return
    input.build()
    prompt.set({ input: input.message, parts: [] })
    prompt.submit()
  }
  if (input.defer) {
    input.defer(submit)
    return
  }
  setTimeout(submit, 0)
}

export async function implementPlanInFreshContext(input: {
  plan: { messageID: string } | undefined
  create: () => Promise<{ id: string }>
  promptAsync: (sessionID: string) => Promise<unknown>
  finish: (messageID: string) => void
  build: () => void
  navigate: (sessionID: string) => void
}) {
  if (!input.plan) return
  const created = await input.create()
  await input.promptAsync(created.id)
  input.finish(input.plan.messageID)
  input.build()
  input.navigate(created.id)
}

type RetryAction = Extract<SessionStatus, { type: "retry" }>["action"]

function goUpsellKeys(action: RetryAction) {
  if (!action) return
  if (!GO_UPSELL_PROVIDERS.has(action.provider)) return
  if (action.reason === "free_tier_limit") {
    return {
      lastSeenAt: GO_UPSELL_FREE_TIER_LAST_SEEN_AT,
      dontShow: GO_UPSELL_FREE_TIER_DONT_SHOW,
    }
  }
  if (action.reason === "account_rate_limit") {
    return {
      lastSeenAt: GO_UPSELL_ACCOUNT_RATE_LIMIT_LAST_SEEN_AT,
      dontShow: GO_UPSELL_ACCOUNT_RATE_LIMIT_DONT_SHOW,
    }
  }
}

const sessionBindingCommands = [
  "session.share",
  "session.rename",
  "session.timeline",
  "session.fork",
  "session.compact",
  "session.continue",
  "session.unshare",
  "session.undo",
  "session.undo_message",
  "session.redo",
  "session.sidebar.toggle",
  "session.toggle.conceal",
  "session.toggle.timestamps",
  "session.toggle.thinking",
  "session.toggle.actions",
  "session.toggle.scrollbar",
  "session.toggle.generic_tool_output",
  "session.first",
  "session.last",
  "session.messages_last_user",
  "session.message.next",
  "session.message.previous",
  "messages.copy",
  "session.copy",
  "session.export",
  "session.child.first",
  "session.parent",
  "session.child.next",
  "session.child.previous",
] as const

const sessionGlobalBindingCommands = [
  "session.page.up",
  "session.page.down",
  "session.line.up",
  "session.line.down",
  "session.half.page.up",
  "session.half.page.down",
] as const

const sessionGlobalUnfocusedBindingCommands = ["session.first", "session.last"] as const

const context = createContext<{
  width: number
  sessionID: string
  conceal: () => boolean
  thinkingMode: () => ThinkingMode
  showThinking: () => boolean
  showTimestamps: () => boolean
  showDetails: () => boolean
  showGenericToolOutput: () => boolean
  diffWrapMode: () => "word" | "none"
  providers: () => ReadonlyMap<string, Provider>
  sync: ReturnType<typeof useSync>
  tui: ReturnType<typeof useTuiConfig>
}>()

function use() {
  const ctx = useContext(context)
  if (!ctx) throw new Error(t(Locale.language(), "tui.error.session_context_missing"))
  return ctx
}

export function Session() {
  const setEpilogue = useEpilogue()
  const clipboard = useClipboard()
  const writeExport = async (file: string, content: string) => {
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, content)
  }
  const pluginRuntime = usePluginRuntime()
  const route = useRouteData("session")
  const { navigate } = useRoute()
  const sync = useSync()
  const event = useEvent()
  const project = useProject()
  const paths = useTuiPaths()
  const tuiConfig = useTuiConfig()
  const kv = useKV()
  const { theme } = useTheme()
  const promptRef = usePromptRef()
  const session = createMemo(() => sync.session.get(route.sessionID))
  const location = createMemo(() => {
    const current = session()
    return current ? { directory: current.directory, workspaceID: current.workspaceID } : undefined
  })

  createEffect(() => {
    const title = Locale.truncate(session()?.title ?? "", 50)
    setEpilogue(sessionEpilogue({ title, sessionID: session()?.id }))
  })
  onCleanup(() => setEpilogue())
  const children = createMemo(() => {
    const parentID = session()?.parentID ?? session()?.id
    return sync.data.session
      .filter((x) => x.parentID === parentID || x.id === parentID)
      .toSorted((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
  })
  const messages = createMemo(() => sync.data.message[route.sessionID] ?? [])
  const hasUserMessage = createMemo(() => messages().some((message) => message.role === "user"))
  const canContinue = createMemo(() => {
    const status = sync.data.session_status[route.sessionID]
    return (!status || status.type === "idle") && hasUserMessage()
  })
  const foregroundTasks = createMemo(() =>
    sync.data.capabilities.experimentalBackgroundSubagents
      ? messages().flatMap((message) =>
          (sync.data.part[message.id] ?? []).filter(
            (part): part is ToolPart =>
              part.type === "tool" &&
              part.tool === "task" &&
              part.state.status === "running" &&
              part.state.metadata?.background !== true,
          ),
        )
      : [],
  )
  const permissions = createMemo(() => {
    if (session()?.parentID) return []
    return children().flatMap((x) => sync.data.permission[x.id] ?? [])
  })
  const questions = createMemo(() => {
    if (session()?.parentID) return []
    return children().flatMap((x) => sync.data.question[x.id] ?? [])
  })
  const [pendingPlan, setPendingPlan] = createSignal<Plan>()
  let handledPlanID: string | undefined
  const visible = createMemo(
    () => !session()?.parentID && permissions().length === 0 && questions().length === 0 && !pendingPlan(),
  )
  const disabled = createMemo(() => permissions().length > 0 || questions().length > 0 || !!pendingPlan())

  const pending = createMemo(() => {
    const completed = messages().findLast((x) => x.role === "assistant" && x.time.completed)?.id
    return messages().findLast((x) => x.role === "assistant" && !x.time.completed && (!completed || x.id > completed))
      ?.id
  })

  const lastAssistant = createMemo(() => {
    return messages().findLast((x) => x.role === "assistant")
  })

  const dimensions = useTerminalDimensions()
  const [sidebar, setSidebar] = kv.signal<"auto" | "hide">("sidebar", "auto")
  const [sidebarOpen, setSidebarOpen] = createSignal(false)
  const [conceal, setConceal] = createSignal(true)
  const thinking = useThinkingMode()
  const thinkingMode = thinking.mode
  const showThinking = createMemo(() => thinkingMode() !== "hidden")
  const [timestamps, setTimestamps] = kv.signal<"hide" | "show">("timestamps", "hide")
  const [showDetails, setShowDetails] = kv.signal("tool_details_visibility", true)
  const [showAssistantMetadata, _setShowAssistantMetadata] = kv.signal("assistant_metadata_visibility", true)
  const [showScrollbar, setShowScrollbar] = kv.signal("scrollbar_visible", false)
  const [diffWrapMode] = kv.signal<"word" | "none">("diff_wrap_mode", "word")
  const [_animationsEnabled, _setAnimationsEnabled] = kv.signal("animations_enabled", true)
  const [showGenericToolOutput, setShowGenericToolOutput] = kv.signal("generic_tool_output_visibility", false)

  const wide = createMemo(() => dimensions().width > 120)
  const sidebarVisible = createMemo(() => {
    if (session()?.parentID) return false
    if (sidebarOpen()) return true
    if (sidebar() === "auto" && wide()) return true
    return false
  })
  const showTimestamps = createMemo(() => timestamps() === "show")
  const contentWidth = createMemo(
    () => dimensions().width - (sidebarVisible() ? 42 : 0) - 4 - (showScrollbar() ? 1 : 0),
  )
  const providers = createMemo(() => Model.index(sync.data.provider))

  const scrollAcceleration = createMemo(() => getScrollAcceleration(tuiConfig))
  const toast = useToast()
  const sdk = useSDK()
  const editor = useEditorContext()
  const i18n = useI18n()

  createEffect(() => {
    const sessionID = route.sessionID
    void (async () => {
      const previousWorkspace = untrack(() => project.workspace.current())
      const result = await sdk.client.session.get({ sessionID }, { throwOnError: true })
      if (!result.data) {
        toast.show({
          message: i18n.t("error.session_not_found", { id: sessionID }),
          variant: "error",
          duration: 5000,
        })
        navigate({ type: "home" })
        return
      }

      if (result.data.workspaceID !== previousWorkspace) {
        project.workspace.set(result.data.workspaceID)

        // Sync all the data for this workspace. Note that this
        // workspace may not exist anymore which is why this is not
        // fatal. If it doesn't we still want to show the session
        // (which will be non-interactive)
        try {
          await sync.bootstrap({ fatal: false })
        } catch {}
      }
      editor.reconnect(result.data.directory)
      await sync.session.sync(sessionID)
      if (route.sessionID === sessionID && scroll) scroll.scrollBy(100_000)
    })().catch((error) => {
      if (route.sessionID !== sessionID) return
      toast.show({
        message: errorMessage(error),
        variant: "error",
        duration: 5000,
      })
      navigate({ type: "home" })
    })
  })

  event.on("message.part.updated", (evt) => {
    const part = evt.properties.part
    if (part.type !== "plan" || part.sessionID !== route.sessionID || part.time.end === undefined) return
    if (handledPlanID === part.messageID) return
    setPendingPlan({ id: part.id, messageID: part.messageID, text: part.text })
  })

  let seeded = false
  let scroll: ScrollBoxRenderable
  let prompt: PromptRef | undefined
  const bind = (r: PromptRef | undefined) => {
    prompt = r
    promptRef.set(r)
    if (seeded || !route.prompt || !r) return
    seeded = true
    r.set(route.prompt)
  }
  const keymap = useMiaopanCodeKeymap()
  const dialog = useDialog()
  const renderer = useRenderer()

  event.on("session.status", (evt) => {
    if (evt.properties.sessionID !== route.sessionID) return
    if (evt.properties.status.type !== "retry") return
    if (!evt.properties.status.action) return
    if (dialog.stack.length > 0) return

    const keys = goUpsellKeys(evt.properties.status.action)
    if (!keys) return

    const seen = kv.get(keys.lastSeenAt)
    if (typeof seen === "number" && Date.now() - seen < GO_UPSELL_WINDOW) return

    if (kv.get(keys.dontShow)) return

    void DialogRetryAction.show(dialog, evt.properties.status.action).then((dontShowAgain) => {
      if (dontShowAgain) kv.set(keys.dontShow, true)
      kv.set(keys.lastSeenAt, Date.now())
    })
  })

  // Helper: Find next visible message boundary in direction
  const findNextVisibleMessage = (direction: "next" | "prev"): string | null => {
    const children = scroll.getChildren()
    const messagesList = messages()
    const scrollTop = scroll.y

    // Get visible messages sorted by position, filtering for valid non-synthetic, non-ignored content
    const visibleMessages = children
      .filter((c) => {
        if (!c.id) return false
        const message = messagesList.find((m) => m.id === c.id)
        if (!message) return false

        // Check if message has valid non-synthetic, non-ignored text parts
        const parts = sync.data.part[message.id]
        if (!parts || !Array.isArray(parts)) return false

        return parts.some(
          (part) => part && (part.type === "plan" || (part.type === "text" && !part.synthetic && !part.ignored)),
        )
      })
      .sort((a, b) => a.y - b.y)

    if (visibleMessages.length === 0) return null

    if (direction === "next") {
      // Find first message below current position
      return visibleMessages.find((c) => c.y > scrollTop + 10)?.id ?? null
    }
    // Find last message above current position
    return [...visibleMessages].reverse().find((c) => c.y < scrollTop - 10)?.id ?? null
  }

  // Helper: Scroll to message in direction or fallback to page scroll
  const scrollToMessage = (direction: "next" | "prev", dialog: ReturnType<typeof useDialog>) => {
    const targetID = findNextVisibleMessage(direction)

    if (!targetID) {
      scroll.scrollBy(direction === "next" ? scroll.height : -scroll.height)
      dialog.clear()
      return
    }

    const child = scroll.getChildren().find((c) => c.id === targetID)
    if (child) scroll.scrollBy(child.y - scroll.y - 1)
    dialog.clear()
  }

  function toBottom() {
    setTimeout(() => {
      if (!scroll || scroll.isDestroyed) return
      scroll.scrollTo(scroll.scrollHeight)
    }, 50)
  }

  const local = useLocal()

  function isPlanAvailable(plan: Plan) {
    const assistant = messages().find((message) => message.id === plan.messageID)
    if (assistant?.role !== "assistant" || assistant.agent !== "plan" || !assistant.time.completed) return false
    return isPlanSessionAvailable({
      status: sync.data.session_status[route.sessionID],
      blocked: permissions().length > 0 || questions().length > 0,
    })
  }

  function latestPlan() {
    const message = messages().findLast((message) =>
      (sync.data.part[message.id] ?? []).some((part) => part.type === "plan"),
    )
    return message ? sync.data.part[message.id]?.findLast((part) => part.type === "plan") : undefined
  }

  function isLatestPlan(plan: Plan) {
    return latestPlan()?.id === plan.id
  }

  const planQuestion = createMemo<QuestionRequest | undefined>(() => {
    const plan = pendingPlan()
    if (!plan) return
    if (!isPlanAvailable(plan)) return
    const assistant = messages().find((message) => message.id === plan.messageID)
    if (!assistant || messages().at(-1)?.id !== assistant.id || !isLatestPlan(plan)) return
    return {
      id: `plan_${plan.messageID}`,
      sessionID: route.sessionID,
      questions: [
        {
          header: i18n.t("plan.proposed_title"),
          question: i18n.t("plan.implementation_title"),
          custom: false,
          multiple: false,
          options: planImplementationOptions(i18n).map((option) => ({
            label: option.title,
            description: option.description,
          })),
        },
      ],
    }
  })

  function finishPlanPrompt(messageID: string) {
    handledPlanID = messageID
    if (pendingPlan()?.messageID === messageID) setPendingPlan()
  }

  function implementPlan(plan: Plan | undefined = pendingPlan()) {
    implementPlanInCurrentContext({
      plan,
      prompt: () => prompt,
      finish: finishPlanPrompt,
      build: () => local.agent.set("build"),
      message: i18n.t("plan.implement_message"),
    })
  }

  async function implementPlanFresh(plan: Plan | undefined = pendingPlan()) {
    const model = local.model.current()
    const current = session()
    if (!plan || !model || !current) return
    await implementPlanInFreshContext({
      plan,
      create: async () => {
        const created = await sdk.client.session.create(
          {
            directory: current.directory,
            workspace: current.workspaceID,
            agent: "build",
            model: {
              providerID: model.providerID,
              id: model.modelID,
              variant: local.model.variant.current(),
            },
          },
          { throwOnError: true },
        )
        return created.data
      },
      promptAsync: (sessionID) =>
        sdk.client.session.promptAsync(
          {
            sessionID,
            ...model,
            agent: "build",
            model,
            variant: local.model.variant.current(),
            ...(kv.get("oai", false) ? { oai: true } : {}),
            parts: [{ type: "text", text: i18n.t("plan.fresh_message", { plan: plan.text }) }],
          },
          { throwOnError: true },
        ),
      finish: finishPlanPrompt,
      build: () => local.agent.set("build"),
      navigate: (sessionID) => navigate({ type: "session", sessionID }),
    })
  }

  function answerPlanQuestion(answers: string[][]) {
    const answer = answers[0]?.[0]
    const plan = pendingPlan()
    const implementation = planImplementationOptions(i18n).find((option) => option.title === answer)?.value
    if (implementation === "current") {
      implementPlan(plan)
      return
    }
    if (implementation === "fresh") {
      void implementPlanFresh(plan).catch(toast.error)
      return
    }
    if (plan) finishPlanPrompt(plan.messageID)
  }

  function openPlanImplementationDialog(plan: Plan) {
    if (renderer.getSelection()?.getSelectedText()) return
    if (!isPlanAvailable(plan)) return
    dialog.replace(() => (
      <DialogPlanImplementation
        stale={!isLatestPlan(plan)}
        onSelect={(implementation) => {
          if (implementation === "current") {
            implementPlan(plan)
            return
          }
          if (implementation === "fresh") {
            void implementPlanFresh(plan).catch(toast.error)
            return
          }
          finishPlanPrompt(plan.messageID)
        }}
      />
    ))
  }

  function enterChild(sessionID: string) {
    navigate({
      type: "session",
      sessionID,
    })
    const status = sync.data.session_status[sessionID]
    if (status?.type === "retry") void DialogAlert.show(dialog, i18n.t("tui.retry_error"), status.message)
  }

  function moveFirstChild() {
    if (children().length === 1) return
    const next = children().find((x) => !!x.parentID)
    if (next) enterChild(next.id)
  }

  function moveChild(direction: number) {
    if (children().length === 1) return

    const sessions = children().filter((x) => !!x.parentID)
    let next = sessions.findIndex((x) => x.id === session()?.id) - direction

    if (next >= sessions.length) next = 0
    if (next < 0) next = sessions.length - 1
    if (sessions[next]) enterChild(sessions[next].id)
  }

  function childSessionHandler(func: () => void) {
    return () => {
      if (!session()?.parentID || dialog.stack.length > 0) return
      func()
    }
  }

  async function revertPreviousTurn(revertFiles: boolean) {
    const status = sync.data.session_status?.[route.sessionID]
    if (status?.type !== "idle") await sdk.client.session.abort({ sessionID: route.sessionID }).catch(() => {})
    const revert = session()?.revert?.messageID
    const message = messages().findLast((item) => (!revert || item.id < revert) && item.role === "user")
    if (!message) return
    void sdk.client.session
      .revert({
        sessionID: route.sessionID,
        messageID: message.id,
        revertFiles,
      })
      .then(() => {
        toBottom()
      })
    const parts = sync.data.part[message.id]
    prompt?.set(
      parts.reduce(
        (result, part) => {
          if (part.type === "text") {
            if (!part.synthetic) result.input += part.text
          }
          if (part.type === "file") result.parts.push(stripPromptPartIDs(part))
          return result
        },
        { input: "", parts: [] as PromptInfo["parts"] },
      ),
    )
    dialog.clear()
  }

  const sessionCommandList = createMemo(() => [
    {
      title: i18n.t("session.continue"),
      value: "session.continue",
      suggested: route.type === "session",
      category: i18n.t("tui.session"),
      enabled: canContinue(),
      slash: {
        name: "continue",
      },
      run: async () => {
        if (!hasUserMessage()) {
          toast.show({ message: i18n.t("session.continue_empty"), variant: "warning" })
          return
        }
        if (!canContinue()) return
        await sdk.client.session
          .continue({
            sessionID: route.sessionID,
            model: local.model.current(),
            variant: local.model.variant.current(),
          })
          .catch((error) =>
            toast.show({ message: error instanceof Error ? error.message : String(error), variant: "error" }),
          )
        dialog.clear()
      },
    },
    {
      title: session()?.share?.url ? i18n.t("session.copy_share_link") : i18n.t("session.share"),
      value: "session.share",
      suggested: route.type === "session",
      category: i18n.t("tui.session"),
      enabled: sync.data.config.share !== "disabled",
      slash: {
        name: "share",
      },
      run: async () => {
        const copy = (url: string) =>
          clipboard
            .write?.(url)
            .then(() => toast.show({ message: i18n.t("session.share_link_copied"), variant: "success" }))
            .catch(() => toast.show({ message: i18n.t("session.copy_link_failed"), variant: "error" }))
        const url = session()?.share?.url
        if (url) {
          await copy(url)
          dialog.clear()
          return
        }
        if (!kv.get("share_consent", false)) {
          const ok = await DialogConfirm.show(
            dialog,
            i18n.t("session.share_confirm_title"),
            i18n.t("session.share_confirm_message"),
          )
          if (ok !== true) return
          kv.set("share_consent", true)
        }
        await sdk.client.session
          .share({
            sessionID: route.sessionID,
          })
          .then((res) => copy(res.data!.share!.url))
          .catch((error) => {
            toast.show({
              message: error instanceof Error ? error.message : i18n.t("session.share_failed"),
              variant: "error",
            })
          })
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.rename"),
      value: "session.rename",
      category: i18n.t("tui.session"),
      slash: {
        name: "rename",
      },
      run: () => {
        dialog.replace(() => <DialogSessionRename session={route.sessionID} />)
      },
    },
    {
      title: i18n.t("session.jump_to_message"),
      value: "session.timeline",
      category: i18n.t("tui.session"),
      slash: {
        name: "timeline",
      },
      run: () => {
        dialog.replace(() => (
          <DialogTimeline
            onMove={(messageID) => {
              const child = scroll.getChildren().find((child) => {
                return child.id === messageID
              })
              if (child) scroll.scrollBy(child.y - scroll.y - 1)
            }}
            sessionID={route.sessionID}
            setPrompt={(promptInfo) => prompt?.set(promptInfo)}
          />
        ))
      },
    },
    {
      title: i18n.t("session.fork"),
      value: "session.fork",
      category: i18n.t("tui.session"),
      slash: {
        name: "fork",
      },
      run: () => {
        dialog.replace(() => (
          <DialogForkFromTimeline
            onMove={(messageID) => {
              if (!messageID) return
              const child = scroll.getChildren().find((child) => {
                return child.id === messageID
              })
              if (child) scroll.scrollBy(child.y - scroll.y - 1)
            }}
            sessionID={route.sessionID}
          />
        ))
      },
    },
    {
      title: i18n.t("session.compact"),
      value: "session.compact",
      category: i18n.t("tui.session"),
      slash: {
        name: "compact",
        aliases: ["summarize"],
      },
      run: () => {
        const selectedModel = local.model.current()
        if (!selectedModel) {
          toast.show({
            variant: "warning",
            message: i18n.t("session.connect_to_summarize"),
            duration: 3000,
          })
          return
        }
        void sdk.client.session.summarize({
          sessionID: route.sessionID,
          modelID: selectedModel.modelID,
          providerID: selectedModel.providerID,
        })
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.unshare"),
      value: "session.unshare",
      category: i18n.t("tui.session"),
      enabled: !!session()?.share?.url,
      slash: {
        name: "unshare",
      },
      run: async () => {
        await sdk.client.session
          .unshare({
            sessionID: route.sessionID,
          })
          .then(() => toast.show({ message: i18n.t("session.unshared"), variant: "success" }))
          .catch((error) => {
            toast.show({
              message: error instanceof Error ? error.message : i18n.t("session.unshare_failed"),
              variant: "error",
            })
          })
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.undo"),
      value: "session.undo",
      category: i18n.t("tui.session"),
      slash: {
        name: "undo",
      },
      run: () => revertPreviousTurn(true),
    },
    {
      title: i18n.t("session.undo_message"),
      value: "session.undo_message",
      category: i18n.t("tui.session"),
      slash: {
        name: "undo-message",
        aliases: ["rewind"],
      },
      run: () => revertPreviousTurn(false),
    },
    {
      title: i18n.t("session.redo"),
      value: "session.redo",
      category: i18n.t("tui.session"),
      enabled: !!session()?.revert?.messageID,
      slash: {
        name: "redo",
      },
      run: () => {
        dialog.clear()
        const messageID = session()?.revert?.messageID
        if (!messageID) return
        const message = messages().find((x) => x.role === "user" && x.id > messageID)
        if (!message) {
          void sdk.client.session.unrevert({
            sessionID: route.sessionID,
          })
          prompt?.set({ input: "", parts: [] })
          return
        }
        void sdk.client.session.revert({
          sessionID: route.sessionID,
          messageID: message.id,
        })
      },
    },
    {
      title: sidebarVisible() ? i18n.t("session.hide_sidebar") : i18n.t("session.show_sidebar"),
      value: "session.sidebar.toggle",
      category: i18n.t("tui.session"),
      run: () => {
        batch(() => {
          const isVisible = sidebarVisible()
          setSidebar(() => (isVisible ? "hide" : "auto"))
          setSidebarOpen(!isVisible)
        })
        dialog.clear()
      },
    },
    {
      title: conceal() ? i18n.t("session.disable_conceal") : i18n.t("session.enable_conceal"),
      value: "session.toggle.conceal",
      category: i18n.t("tui.session"),
      run: () => {
        setConceal((prev) => !prev)
        dialog.clear()
      },
    },
    {
      title: showTimestamps() ? i18n.t("session.hide_timestamps") : i18n.t("session.show_timestamps"),
      value: "session.toggle.timestamps",
      category: i18n.t("tui.session"),
      slash: {
        name: "timestamps",
        aliases: ["toggle-timestamps"],
      },
      run: () => {
        setTimestamps((prev) => (prev === "show" ? "hide" : "show"))
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.thinking_display"),
      value: "session.toggle.thinking",
      category: i18n.t("tui.session"),
      slash: {
        name: "thinking",
        aliases: ["toggle-thinking"],
      },
      run: () => {
        dialog.replace(() => (
          <DialogSelect
            title={i18n.t("session.thinking_display")}
            current={thinkingMode()}
            options={[
              { title: i18n.t("session.collapse_thinking"), value: "collapsed" as const },
              { title: i18n.t("session.expand_thinking"), value: "expanded" as const },
              { title: i18n.t("session.hide_thinking"), value: "hidden" as const },
            ]}
            onSelect={(option) => {
              thinking.set(option.value)
              dialog.clear()
            }}
          />
        ))
      },
    },
    {
      title: showDetails() ? i18n.t("session.hide_tool_details") : i18n.t("session.show_tool_details"),
      value: "session.toggle.actions",
      category: i18n.t("tui.session"),
      run: () => {
        setShowDetails((prev) => !prev)
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.toggle_scrollbar"),
      value: "session.toggle.scrollbar",
      category: i18n.t("tui.session"),
      run: () => {
        setShowScrollbar((prev) => !prev)
        dialog.clear()
      },
    },
    {
      title: showGenericToolOutput() ? i18n.t("session.hide_generic_output") : i18n.t("session.show_generic_output"),
      value: "session.toggle.generic_tool_output",
      category: i18n.t("tui.session"),
      run: () => {
        setShowGenericToolOutput((prev) => !prev)
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.page_up"),
      value: "session.page.up",
      category: i18n.t("tui.session"),
      hidden: true,
      run: () => {
        scroll.scrollBy(-scroll.height / 2)
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.page_down"),
      value: "session.page.down",
      category: i18n.t("tui.session"),
      hidden: true,
      run: () => {
        scroll.scrollBy(scroll.height / 2)
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.line_up"),
      value: "session.line.up",
      category: i18n.t("tui.session"),
      hidden: true,
      run: () => {
        scroll.scrollBy(-1)
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.line_down"),
      value: "session.line.down",
      category: i18n.t("tui.session"),
      hidden: true,
      run: () => {
        scroll.scrollBy(1)
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.half_page_up"),
      value: "session.half.page.up",
      category: i18n.t("tui.session"),
      hidden: true,
      run: () => {
        scroll.scrollBy(-scroll.height / 4)
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.half_page_down"),
      value: "session.half.page.down",
      category: i18n.t("tui.session"),
      hidden: true,
      run: () => {
        scroll.scrollBy(scroll.height / 4)
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.first_message"),
      value: "session.first",
      category: i18n.t("tui.session"),
      hidden: true,
      run: () => {
        scroll.scrollTo(0)
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.last_message"),
      value: "session.last",
      category: i18n.t("tui.session"),
      hidden: true,
      run: () => {
        scroll.scrollTo(scroll.scrollHeight)
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.last_user_message"),
      value: "session.messages_last_user",
      category: i18n.t("tui.session"),
      hidden: true,
      run: () => {
        const messages = sync.data.message[route.sessionID]
        if (!messages || !messages.length) return

        // Find the most recent user message with non-ignored, non-synthetic text parts
        for (let i = messages.length - 1; i >= 0; i--) {
          const message = messages[i]
          if (!message || message.role !== "user") continue

          const parts = sync.data.part[message.id]
          if (!parts || !Array.isArray(parts)) continue

          const hasValidTextPart = parts.some(
            (part) => part && part.type === "text" && !part.synthetic && !part.ignored,
          )

          if (hasValidTextPart) {
            const child = scroll.getChildren().find((child) => {
              return child.id === message.id
            })
            if (child) scroll.scrollBy(child.y - scroll.y - 1)
            break
          }
        }
      },
    },
    {
      title: i18n.t("session.next_message"),
      value: "session.message.next",
      category: i18n.t("tui.session"),
      hidden: true,
      run: () => scrollToMessage("next", dialog),
    },
    {
      title: i18n.t("session.previous_message"),
      value: "session.message.previous",
      category: i18n.t("tui.session"),
      hidden: true,
      run: () => scrollToMessage("prev", dialog),
    },
    {
      title: i18n.t("session.copy_last_assistant"),
      value: "messages.copy",
      category: i18n.t("tui.session"),
      run: () => {
        const revertID = session()?.revert?.messageID
        const lastAssistantMessage = messages().findLast(
          (msg) => msg.role === "assistant" && (!revertID || msg.id < revertID),
        )
        if (!lastAssistantMessage) {
          toast.show({ message: i18n.t("session.no_assistant"), variant: "error" })
          dialog.clear()
          return
        }

        const parts = sync.data.part[lastAssistantMessage.id] ?? []
        const textParts = parts.filter((part) => part.type === "text" || part.type === "plan")
        if (textParts.length === 0) {
          toast.show({ message: i18n.t("session.no_text_parts"), variant: "error" })
          dialog.clear()
          return
        }

        const text = textParts
          .map((part) => part.text)
          .join("\n")
          .trim()
        if (!text) {
          toast.show({
            message: i18n.t("session.no_text_content"),
            variant: "error",
          })
          dialog.clear()
          return
        }

        clipboard
          .write?.(text)
          .then(() => toast.show({ message: i18n.t("session.message_copied"), variant: "success" }))
          .catch(() => toast.show({ message: i18n.t("session.copy_failed"), variant: "error" }))
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.copy_transcript"),
      value: "session.copy",
      category: i18n.t("tui.session"),
      slash: {
        name: "copy",
      },
      run: async () => {
        try {
          const sessionData = session()
          if (!sessionData) return
          const sessionMessages = messages()
          const transcript = formatTranscript(
            sessionData,
            sessionMessages.map((msg) => ({ info: msg, parts: sync.data.part[msg.id] ?? [] })),
            {
              thinking: showThinking(),
              toolDetails: showDetails(),
              assistantMetadata: showAssistantMetadata(),
              providers: sync.data.provider,
            },
          )
          await clipboard.write?.(transcript)
          toast.show({ message: i18n.t("session.transcript_copied"), variant: "success" })
        } catch {
          toast.show({ message: i18n.t("session.transcript_copy_failed"), variant: "error" })
        }
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.export_transcript"),
      value: "session.export",
      category: i18n.t("tui.session"),
      slash: {
        name: "export",
      },
      run: async () => {
        try {
          const sessionData = session()
          if (!sessionData) return
          const sessionMessages = messages()

          const defaultFilename = `session-${sessionData.id.slice(0, 8)}.md`

          const options = await DialogExportOptions.show(
            dialog,
            defaultFilename,
            showThinking(),
            showDetails(),
            showAssistantMetadata(),
            false,
          )

          if (options === null) return

          const transcript = formatTranscript(
            sessionData,
            sessionMessages.map((msg) => ({ info: msg, parts: sync.data.part[msg.id] ?? [] })),
            {
              thinking: options.thinking,
              toolDetails: options.toolDetails,
              assistantMetadata: options.assistantMetadata,
              providers: sync.data.provider,
            },
          )

          if (options.openWithoutSaving) {
            // Just open in editor without saving
            await openEditor({
              renderer,
              value: transcript,
              cwd:
                (project.instance.path().worktree === "/" ? undefined : project.instance.path().worktree) ||
                project.instance.directory() ||
                paths.cwd,
            })
          } else {
            const exportDir = paths.cwd
            const filename = options.filename.trim()
            const filepath = path.join(exportDir, filename)

            await writeExport(filepath, transcript)

            // Open with EDITOR if available
            const result = await openEditor({
              renderer,
              value: transcript,
              cwd:
                (project.instance.path().worktree === "/" ? undefined : project.instance.path().worktree) ||
                project.instance.directory() ||
                paths.cwd,
            })
            if (result !== undefined) {
              await writeExport(filepath, result)
            }

            toast.show({ message: i18n.t("session.exported", { filename }), variant: "success" })
          }
        } catch {
          toast.show({ message: i18n.t("session.export_failed"), variant: "error" })
        }
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.background_subagents"),
      value: "session.background",
      category: i18n.t("tui.session"),
      hidden: true,
      enabled: foregroundTasks().length > 0,
      run: () => {
        void sdk.client.experimental.session.background({
          sessionID: route.sessionID,
          workspace: project.workspace.current(),
        })
        dialog.clear()
      },
    },
    {
      title: i18n.t("session.go_child"),
      value: "session.child.first",
      category: i18n.t("tui.session"),
      hidden: true,
      run: () => {
        dialog.clear()
        moveFirstChild()
      },
    },
    {
      title: i18n.t("session.go_parent"),
      value: "session.parent",
      category: i18n.t("tui.session"),
      hidden: true,
      enabled: !!session()?.parentID,
      run: childSessionHandler(() => {
        const parentID = session()?.parentID
        if (parentID) {
          navigate({
            type: "session",
            sessionID: parentID,
          })
        }
        dialog.clear()
      }),
    },
    {
      title: i18n.t("session.next_child"),
      value: "session.child.next",
      category: i18n.t("tui.session"),
      hidden: true,
      enabled: !!session()?.parentID,
      run: childSessionHandler(() => {
        dialog.clear()
        moveChild(1)
      }),
    },
    {
      title: i18n.t("session.previous_child"),
      value: "session.child.previous",
      category: i18n.t("tui.session"),
      hidden: true,
      enabled: !!session()?.parentID,
      run: childSessionHandler(() => {
        dialog.clear()
        moveChild(-1)
      }),
    },
  ])

  const sessionCommands = createMemo(() =>
    sessionCommandList().map((command) => ({
      namespace: "palette",
      name: command.value,
      desc: "description" in command ? command.description : undefined,
      slashName: "slash" in command ? command.slash?.name : undefined,
      slashAliases: "slash" in command ? command.slash?.aliases : undefined,
      ...command,
    })),
  )

  useBindings(() => ({
    commands: sessionCommands(),
  }))

  useBindings(() => ({
    bindings: tuiConfig.keybinds.gather("session.global", sessionGlobalBindingCommands),
  }))

  useBindings(() => ({
    enabled: () => renderer.currentFocusedEditor === null,
    bindings: tuiConfig.keybinds.gather("session.global.unfocused", sessionGlobalUnfocusedBindingCommands),
  }))

  useBindings(() => ({
    mode: MIAOPAN_CODE_BASE_MODE,
    bindings: tuiConfig.keybinds.gather("session", sessionBindingCommands),
  }))

  useBindings(() => ({
    mode: MIAOPAN_CODE_BASE_MODE,
    enabled: foregroundTasks().length > 0,
    priority: 1,
    bindings: tuiConfig.keybinds.get("session.background"),
  }))

  const revertInfo = createMemo(() => session()?.revert)
  const revertMessageID = createMemo(() => revertInfo()?.messageID)

  const revertDiffFiles = createMemo(() => getRevertDiffFiles(revertInfo()?.diff ?? ""))

  const revertRevertedMessages = createMemo(() => {
    const messageID = revertMessageID()
    if (!messageID) return []
    return messages().filter((x) => x.id >= messageID && x.role === "user")
  })

  const revert = createMemo(() => {
    const info = revertInfo()
    if (!info) return
    if (!info.messageID) return
    return {
      messageID: info.messageID,
      reverted: revertRevertedMessages(),
      diff: info.diff,
      diffFiles: revertDiffFiles(),
    }
  })

  // snap to bottom when session changes
  createEffect(on(() => route.sessionID, toBottom))

  return (
    <LocationProvider location={location()}>
      <context.Provider
        value={{
          get width() {
            return contentWidth()
          },
          sessionID: route.sessionID,
          conceal,
          thinkingMode,
          showThinking,
          showTimestamps,
          showDetails,
          showGenericToolOutput,
          diffWrapMode,
          providers,
          sync,
          tui: tuiConfig,
        }}
      >
        <box flexDirection="row" flexGrow={1} minHeight={0}>
          <box flexGrow={1} minHeight={0} paddingBottom={1} paddingLeft={2} paddingRight={2} gap={1}>
            <Show
              when={session()}
              fallback={
                <box flexGrow={1} alignItems="center" justifyContent="center">
                  <Spinner color={theme.textMuted}>{i18n.t("tui.loading")}</Spinner>
                </box>
              }
            >
              <scrollbox
                ref={(r) => (scroll = r)}
                viewportOptions={{
                  paddingRight: showScrollbar() ? 1 : 0,
                }}
                verticalScrollbarOptions={{
                  paddingLeft: 1,
                  visible: showScrollbar(),
                  trackOptions: {
                    backgroundColor: theme.backgroundElement,
                    foregroundColor: theme.border,
                  },
                }}
                stickyScroll={true}
                stickyStart="bottom"
                flexGrow={1}
                scrollAcceleration={scrollAcceleration()}
              >
                <box height={1} />
                <For each={messages()}>
                  {(message, index) => (
                    <Switch>
                      <Match when={message.id === revert()?.messageID}>
                        {(function () {
                          const redoShortcut = useCommandShortcut("session.redo")
                          const [hover, setHover] = createSignal(false)
                          const dialog = useDialog()

                          const handleUnrevert = async () => {
                            const confirmed = await DialogConfirm.show(
                              dialog,
                              i18n.t("session.confirm_redo"),
                              i18n.t("session.confirm_redo_message"),
                            )
                            if (confirmed) {
                              keymap.dispatchCommand("session.redo")
                            }
                          }

                          return (
                            <box
                              onMouseOver={() => setHover(true)}
                              onMouseOut={() => setHover(false)}
                              onMouseUp={handleUnrevert}
                              marginTop={1}
                              flexShrink={0}
                              border={["left"]}
                              customBorderChars={SplitBorder.customBorderChars}
                              borderColor={theme.backgroundPanel}
                            >
                              <box
                                paddingTop={1}
                                paddingBottom={1}
                                paddingLeft={2}
                                backgroundColor={hover() ? theme.backgroundElement : theme.backgroundPanel}
                              >
                                <text fg={theme.textMuted}>
                                  {t(Locale.language(), "session.messages_reverted", {
                                    count: revert()!.reverted.length,
                                  })}
                                </text>
                                <text fg={theme.textMuted}>
                                  {t(Locale.language(), "session.redo_restore", { key: redoShortcut() })}
                                </text>
                                <Show when={revert()!.diffFiles?.length}>
                                  <box marginTop={1}>
                                    <For each={revert()!.diffFiles}>
                                      {(file) => (
                                        <text fg={theme.text}>
                                          {file.filename}
                                          <Show when={file.additions > 0}>
                                            <span style={{ fg: theme.diffAdded }}> +{file.additions}</span>
                                          </Show>
                                          <Show when={file.deletions > 0}>
                                            <span style={{ fg: theme.diffRemoved }}> -{file.deletions}</span>
                                          </Show>
                                        </text>
                                      )}
                                    </For>
                                  </box>
                                </Show>
                              </box>
                            </box>
                          )
                        })()}
                      </Match>
                      <Match when={revert()?.messageID && message.id >= revert()!.messageID}>
                        <></>
                      </Match>
                      <Match when={message.role === "user"}>
                        <UserMessage
                          index={index()}
                          onMouseUp={() => {
                            if (renderer.getSelection()?.getSelectedText()) return
                            dialog.replace(() => (
                              <DialogMessage
                                messageID={message.id}
                                sessionID={route.sessionID}
                                setPrompt={(promptInfo) => prompt?.set(promptInfo)}
                              />
                            ))
                          }}
                          message={message as UserMessage}
                          parts={sync.data.part[message.id] ?? []}
                          pending={pending()}
                        />
                      </Match>
                      <Match when={message.role === "assistant"}>
                        <AssistantMessage
                          last={lastAssistant()?.id === message.id}
                          message={message as AssistantMessage}
                          parts={sync.data.part[message.id] ?? []}
                          onPlanClick={openPlanImplementationDialog}
                        />
                      </Match>
                    </Switch>
                  )}
                </For>
              </scrollbox>
              <box flexShrink={0}>
                <Show when={permissions().length > 0}>
                  <PermissionPrompt
                    request={permissions()[0]}
                    directory={sync.session.get(permissions()[0].sessionID)?.directory}
                  />
                </Show>
                <Show when={permissions().length === 0 && questions().length > 0}>
                  <QuestionPrompt
                    request={questions()[0]}
                    directory={sync.session.get(questions()[0].sessionID)?.directory}
                  />
                </Show>
                <Show when={permissions().length === 0 && questions().length === 0 && planQuestion()}>
                  {(request) => (
                    <QuestionPrompt
                      request={request()}
                      onReply={answerPlanQuestion}
                      onReject={() => {
                        const plan = pendingPlan()
                        if (plan) finishPlanPrompt(plan.messageID)
                      }}
                    />
                  )}
                </Show>
                <Show when={session()?.parentID}>
                  <SubagentFooter />
                </Show>
                <Show when={visible()}>
                  <pluginRuntime.Slot
                    name="session_prompt"
                    mode="replace"
                    session_id={route.sessionID}
                    visible={visible()}
                    disabled={disabled()}
                    on_submit={toBottom}
                    ref={bind}
                  >
                    <Prompt
                      visible={visible()}
                      ref={bind}
                      disabled={disabled()}
                      onSubmit={() => {
                        toBottom()
                      }}
                      sessionID={route.sessionID}
                      right={<pluginRuntime.Slot name="session_prompt_right" session_id={route.sessionID} />}
                    />
                  </pluginRuntime.Slot>
                </Show>
              </box>
            </Show>
            <Toast />
          </box>
          <Show when={sidebarVisible()}>
            <Switch>
              <Match when={wide()}>
                <Sidebar sessionID={route.sessionID} />
              </Match>
              <Match when={!wide()}>
                <box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  alignItems="flex-end"
                  backgroundColor={RGBA.fromInts(0, 0, 0, 70)}
                >
                  <Sidebar sessionID={route.sessionID} />
                </box>
              </Match>
            </Switch>
          </Show>
        </box>
      </context.Provider>
    </LocationProvider>
  )
}

function UserMessage(props: {
  message: UserMessage
  parts: Part[]
  onMouseUp: () => void
  index: number
  pending?: string
}) {
  const ctx = use()
  const i18n = useI18n()
  const local = useLocal()
  const text = createMemo(() => {
    const texts = props.parts
      .map((x) => {
        if (x.type === "text" && !x.synthetic) {
          return x.text
        }
        return null
      })
      .filter(Boolean)
    return texts.join("\n\n")
  })
  const files = createMemo(() => props.parts.flatMap((x) => (x.type === "file" ? [x] : [])))
  const { theme } = useTheme()
  const [hover, setHover] = createSignal(false)
  const queued = createMemo(() => props.pending && props.message.id > props.pending)
  const color = createMemo(() => local.agent.color(props.message.agent))
  const queuedFg = createMemo(() => selectedForeground(theme, color()))
  const metadataVisible = createMemo(() => queued() || ctx.showTimestamps())

  const compaction = createMemo(() => props.parts.find((x) => x.type === "compaction"))

  return (
    <>
      <Show when={text()}>
        <box
          id={props.message.id}
          ref={(el: BoxRenderable) => alwaysSeparate.add(el)}
          border={["left"]}
          borderColor={color()}
          customBorderChars={SplitBorder.customBorderChars}
          marginTop={props.index === 0 ? 0 : 1}
        >
          <box
            onMouseOver={() => {
              setHover(true)
            }}
            onMouseOut={() => {
              setHover(false)
            }}
            onMouseUp={props.onMouseUp}
            paddingTop={1}
            paddingBottom={1}
            paddingLeft={2}
            backgroundColor={hover() ? theme.backgroundElement : theme.backgroundPanel}
            flexShrink={0}
          >
            <text fg={theme.text}>{text()}</text>
            <Show when={files().length}>
              <box flexDirection="row" paddingBottom={metadataVisible() ? 1 : 0} paddingTop={1} gap={1} flexWrap="wrap">
                <For each={files()}>
                  {(file) => {
                    const directory = file.mime === "application/x-directory"
                    return (
                      <text fg={theme.text}>
                        <span style={{ bg: theme.secondary, fg: theme.background }}>
                          {` ${t(Locale.language(), directory ? "tui.directory_badge" : "tui.file_badge")} `}
                        </span>
                        <span style={{ bg: theme.backgroundElement, fg: theme.textMuted }}> {file.filename} </span>
                      </text>
                    )
                  }}
                </For>
              </box>
            </Show>
            <Show
              when={queued()}
              fallback={
                <Show when={ctx.showTimestamps()}>
                  <text fg={theme.textMuted}>
                    <span style={{ fg: theme.textMuted }}>
                      {Locale.todayTimeOrDateTime(props.message.time.created)}
                    </span>
                  </text>
                </Show>
              }
            >
              <text fg={theme.textMuted}>
                <span style={{ bg: color(), fg: queuedFg(), bold: true }}> {i18n.t("tui.queued")} </span>
              </text>
            </Show>
          </box>
        </box>
      </Show>
      <Show when={compaction()}>
        <box
          marginTop={1}
          border={["top"]}
          title={` ${i18n.t("tui.compaction")} `}
          titleAlignment="center"
          borderColor={theme.borderActive}
        />
      </Show>
    </>
  )
}

function AssistantMessage(props: {
  message: AssistantMessage
  parts: Part[]
  last: boolean
  onPlanClick: (part: PlanPartData) => void
}) {
  const ctx = use()
  const i18n = useI18n()
  const local = useLocal()
  const { theme } = useTheme()
  const sync = useSync()
  const clipboard = useClipboard()
  const toast = useToast()
  const renderer = useRenderer()
  const dialog = useDialog()
  const kv = useKV()
  const [copyHover, setCopyHover] = createSignal(false)
  const messages = createMemo(() => sync.data.message[props.message.sessionID] ?? [])
  const model = createMemo(() => Model.name(ctx.providers(), props.message.providerID, props.message.modelID))

  const final = createMemo(() => {
    return props.message.finish && !["tool-calls", "unknown"].includes(props.message.finish)
  })

  const sessionStatus = createMemo(() => sync.data.session_status[props.message.sessionID] ?? { type: "idle" })
  const working = createMemo(() => props.last && !final() && !props.message.error && sessionStatus().type !== "idle")
  const animationsEnabled = createMemo(() => kv.get("animations_enabled", true))
  const [clock, setClock] = createSignal(Date.now())
  const retry = createMemo(() => {
    const value = sessionStatus()
    if (value.type !== "retry") return
    return value
  })
  const retryMessage = createMemo(() => {
    const value = retry()
    if (!value) return
    if (value.message.includes("exceeded your current quota") && value.message.includes("gemini"))
      return i18n.t("tui.gemini_quota")
    if (value.message.length > 80) return value.message.slice(0, 80) + "..."
    return value.message
  })
  const retryTruncated = createMemo(() => (retry()?.message.length ?? 0) > 120)
  const retrySeconds = createMemo(() => {
    const next = retry()?.next
    if (next === undefined) return 0
    return Math.max(0, Math.round((next - clock()) / 1000))
  })

  const retryText = createMemo(() => {
    const value = retry()
    if (!value) return
    const message = retryMessage() ?? ""
    const truncatedHint = retryTruncated() ? i18n.t("tui.retry_expand") : ""
    const duration = formatDuration(retrySeconds())
    const retryInfo = i18n.t("tui.retry_info", {
      attempt: value.attempt,
      duration: duration ? ` ${duration} ` : " ",
    })
    return message + truncatedHint + retryInfo
  })

  const handleRetryClick = () => {
    const value = retry()
    if (!value || !retryTruncated()) return
    void DialogAlert.show(dialog, i18n.t("tui.retry_error"), value.message)
  }

  const handleCopy = () => {
    if (renderer.getSelection()?.getSelectedText()) return
    const text = props.parts
      .filter((part): part is TextPart | PlanPartData => part.type === "text" || part.type === "plan")
      .map((part) => part.text)
      .join("\n")
      .trim()
    if (!text || !clipboard.write) return
    clipboard
      .write(text)
      .then(() => toast.show({ message: i18n.t("tui.copied_to_clipboard"), variant: "success" }))
      .catch(() => toast.show({ message: i18n.t("session.copy_failed"), variant: "error" }))
  }

  const turnStartedAt = createMemo(() => {
    const user = messages().find((x) => x.role === "user" && x.id === props.message.parentID)
    if (!user?.time) return
    const continued = messages().some(
      (message) =>
        message.role === "assistant" &&
        message.parentID === props.message.parentID &&
        message.id < props.message.id &&
        message.finish !== undefined &&
        !["tool-calls", "unknown"].includes(message.finish),
    )
    return continued ? props.message.time.created : user.time.created
  })

  const duration = createMemo(() => {
    if (!final()) return 0
    if (!props.message.time.completed) return 0
    const startedAt = turnStartedAt()
    if (startedAt === undefined) return 0
    return props.message.time.completed - startedAt
  })
  const workingStartedAt = createMemo(() => turnStartedAt() ?? props.message.time.created)
  const workingElapsed = createMemo(() => Math.max(0, Math.floor((clock() - workingStartedAt()) / 1000)))

  createEffect(() => {
    if (!working()) return
    setClock(Date.now())
    const timer = setInterval(() => setClock(Date.now()), 1000)
    onCleanup(() => clearInterval(timer))
  })

  const childShortcut = useCommandShortcut("session.child.first")
  const backgroundShortcut = useCommandShortcut("session.background")
  const interruptShortcut = useCommandShortcut("session.interrupt")
  const displayParts = createMemo(() =>
    assistantDisplayParts(props.parts, {
      last: props.last,
      thinkingMode: ctx.thinkingMode(),
      toolDisplay: ctx.tui.tool_display,
      showDetails: ctx.showDetails(),
    }),
  )

  return (
    <>
      <For each={displayParts()}>
        {(part, index) => (
          <AssistantPart
            part={part}
            last={index() === displayParts().length - 1}
            message={props.message}
            onPlanClick={props.onPlanClick}
          />
        )}
      </For>
      <Show when={props.parts.some((x) => x.type === "tool" && x.tool === "task")}>
        <box paddingTop={1} paddingLeft={3}>
          <text fg={theme.text}>
            {childShortcut()}
            <span style={{ fg: theme.textMuted }}> {i18n.t("tui.view_subagents")}</span>
            <Show
              when={
                sync.data.capabilities.experimentalBackgroundSubagents &&
                props.parts.some(
                  (x) =>
                    x.type === "tool" &&
                    x.tool === "task" &&
                    x.state.status === "running" &&
                    x.state.metadata?.background !== true,
                )
              }
            >
              <span style={{ fg: theme.textMuted }}> · </span>
              {backgroundShortcut()}
              <span style={{ fg: theme.textMuted }}> {i18n.t("session.background_subagents")}</span>
            </Show>
          </text>
        </box>
      </Show>
      <Show when={props.message.error && props.message.error.name !== "MessageAbortedError"}>
        <AssistantError error={errorMessage(props.message.error)} width={ctx.width} />
      </Show>
      <Switch>
        <Match when={props.last || final() || props.message.error?.name === "MessageAbortedError"}>
          <box
            ref={(el: BoxRenderable) => alwaysSeparate.add(el)}
            paddingLeft={3}
            flexDirection="row"
            justifyContent="space-between"
            marginTop={1}
          >
            <Show
              when={working()}
              fallback={
                <text>
                  <span
                    style={{
                      fg:
                        props.message.error?.name === "MessageAbortedError"
                          ? theme.textMuted
                          : local.agent.color(props.message.agent),
                    }}
                  >
                    ▣{" "}
                  </span>{" "}
                  <span style={{ fg: theme.text }}>{Locale.titlecase(props.message.mode)}</span>
                  <span style={{ fg: theme.textMuted }}> · {model()}</span>
                  <Show when={duration()}>
                    <span style={{ fg: theme.textMuted }}> · {Locale.duration(duration())}</span>
                  </Show>
                  <Show when={props.message.error?.name === "MessageAbortedError"}>
                    <span style={{ fg: theme.textMuted }}> · {t(Locale.language(), "tui.interrupted")}</span>
                  </Show>
                </text>
              }
            >
              <CodexStatus
                elapsed={workingElapsed()}
                model={model()}
                color={local.agent.color(props.message.agent)}
                animationsEnabled={animationsEnabled()}
                interruptShortcut={interruptShortcut()}
                interruptText={i18n.t("tui.to_interrupt")}
                retryText={retryText()}
                onRetryClick={handleRetryClick}
              />
            </Show>
            <Show when={props.message.time.completed}>
              <box onMouseOver={() => setCopyHover(true)} onMouseOut={() => setCopyHover(false)} onMouseUp={handleCopy}>
                <text fg={copyHover() ? theme.text : theme.textMuted}>⎘ {i18n.t("tui.copy")}</text>
              </box>
            </Show>
          </box>
        </Match>
      </Switch>
    </>
  )
}

export function AssistantError(props: { error: string; width: number }) {
  const { theme } = useTheme()
  const renderer = useRenderer()
  const [expanded, setExpanded] = createSignal(false)
  const collapsed = createMemo(() => collapseToolOutput(props.error, 3, 3 * Math.max(20, props.width - 6)))
  const toggle = () => {
    if (!collapsed().overflow) return
    if (renderer.getSelection()?.getSelectedText()) return
    setExpanded((previous) => !previous)
  }

  return (
    <box
      ref={(el: BoxRenderable) => alwaysSeparate.add(el)}
      border={["left"]}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      marginTop={1}
      backgroundColor={theme.backgroundPanel}
      customBorderChars={SplitBorder.customBorderChars}
      borderColor={theme.error}
      onMouseUp={toggle}
    >
      <text fg={theme.textMuted}>{expanded() ? props.error : collapsed().output}</text>
      <Show when={collapsed().overflow}>
        <text fg={theme.textMuted}>
          {expanded() ? t(Locale.language(), "tui.click_collapse") : t(Locale.language(), "tui.click_expand")}
        </text>
      </Show>
    </box>
  )
}

type CompactExplorePart = { type: "compact-explore"; parts: ToolPart[] }
type DisplayPart = Part | CompactExplorePart

export function assistantDisplayParts(
  parts: Part[],
  input: {
    last: boolean
    thinkingMode: ThinkingMode
    toolDisplay: "compact" | "detailed"
    showDetails: boolean
  },
) {
  const reasoning = input.last ? parts.findLast((part) => part.type === "reasoning") : undefined
  const visible = parts.filter(
    (part) =>
      (part.type !== "text" || !part.synthetic) &&
      (input.thinkingMode !== "hidden" ||
        part.type !== "reasoning" ||
        (part === reasoning && part.time.end === undefined)),
  )
  if (input.toolDisplay !== "compact") return visible

  return visible.reduce<DisplayPart[]>((result, part) => {
    if (part.type !== "tool" || !toolUsesCompactDisplay(part)) {
      result.push(part)
      return result
    }
    if (toolDetailsHidden(input.showDetails, part.tool, part.state)) return result
    const previous = result.at(-1)
    if (previous?.type === "compact-explore" && previous.parts.at(-1)?.tool === part.tool) {
      previous.parts.push(part)
      return result
    }
    result.push({ type: "compact-explore", parts: [part] })
    return result
  }, [])
}

function AssistantPart(props: {
  part: DisplayPart
  last: boolean
  message: AssistantMessage
  onPlanClick: (part: PlanPartData) => void
}) {
  if (props.part.type === "compact-explore") return <CompactExplore part={props.part} />
  if (props.part.type === "text") return <TextPart last={props.last} part={props.part} message={props.message} />
  if (props.part.type === "plan") return <PlanPart part={props.part} onClick={props.onPlanClick} />
  if (props.part.type === "tool") return <ToolPart last={props.last} part={props.part} message={props.message} />
  if (props.part.type === "reasoning")
    return <ReasoningPart last={props.last} part={props.part} message={props.message} />
  return null
}

const INLINE_TOOL_ICON_WIDTH = 2

function ReasoningPart(props: { last: boolean; part: ReasoningPart; message: AssistantMessage }) {
  const { theme } = useTheme()
  const ctx = use()
  const [expanded, setExpanded] = createSignal(false)

  const content = createMemo(() => {
    // OpenRouter encrypts some reasoning blocks; drop the placeholder.
    return props.part.text.replace("[REDACTED]", "").trim()
  })
  // Reasoning is finalized when the server sets `time.end` (see processor.ts).
  // Flips independently of the parent message completing.
  const isDone = createMemo(() => props.part.time.end !== undefined)
  const collapsed = createMemo(() => ctx.thinkingMode() === "collapsed")
  const hidden = createMemo(() => ctx.thinkingMode() === "hidden")
  const duration = createMemo(() => {
    const end = props.part.time.end
    return end === undefined ? 0 : Math.max(0, end - props.part.time.start)
  })
  const summary = createMemo(() => reasoningSummary(content()))
  const syntax = createSyntaxStyleMemo(() => generateSubtleSyntax(theme))

  const toggle = () => {
    if (!collapsed()) return
    setExpanded((prev) => !prev)
  }

  return (
    <Show when={content() && (!hidden() || summary().title)}>
      <box
        ref={(el: BoxRenderable) => alwaysSeparate.add(el)}
        paddingLeft={3}
        marginTop={1}
        flexDirection="column"
        flexShrink={0}
      >
        <box onMouseUp={toggle}>
          <ReasoningHeader
            toggleable={collapsed()}
            open={ctx.thinkingMode() === "expanded" || expanded()}
            done={isDone()}
            title={summary().title}
            duration={isDone() ? Locale.duration(duration()) : undefined}
          />
        </box>
        <Show when={!hidden() && (ctx.thinkingMode() === "expanded" || expanded()) && summary().body}>
          <box paddingLeft={collapsed() ? 2 : 0} marginTop={1}>
            <code
              filetype="markdown"
              drawUnstyledText={false}
              streaming={true}
              syntaxStyle={syntax()}
              content={summary().body}
              conceal={ctx.conceal()}
              fg={theme.textMuted}
            />
          </box>
        </Show>
      </box>
    </Show>
  )
}

function ReasoningHeader(props: {
  toggleable: boolean
  open: boolean
  done: boolean
  title: string | null
  duration?: string
}) {
  const { theme } = useTheme()
  const fg = () =>
    props.open
      ? RGBA.fromValues(theme.warning.r, theme.warning.g, theme.warning.b, theme.thinkingOpacity)
      : theme.warning

  return (
    <Switch>
      <Match when={!props.done}>
        <box flexDirection="row">
          <Spinner color={fg()}>
            {props.title
              ? `${t(Locale.language(), "tui.thinking")}: ${props.title}`
              : t(Locale.language(), "tui.thinking")}
          </Spinner>
        </box>
      </Match>
      <Match when={true}>
        <text fg={fg()} wrapMode="none">
          <Show when={props.toggleable}>
            <span>{props.open ? "- " : "+ "}</span>
          </Show>
          <span>{t(Locale.language(), "tui.thought")}</span>
          <Show when={props.title || props.duration}>
            <span>: </span>
          </Show>
          <Show when={props.title}>
            <span>{props.title}</span>
          </Show>
          <Show when={props.duration}>
            <span>
              {props.title ? " · " : ""}
              {props.duration}
            </span>
          </Show>
        </text>
      </Match>
    </Switch>
  )
}

function TextPart(props: { last: boolean; part: TextPart; message: AssistantMessage }) {
  const ctx = use()
  const { theme, syntax } = useTheme()
  return (
    <Show when={props.part.text.trim()}>
      <box ref={(el: BoxRenderable) => alwaysSeparate.add(el)} paddingLeft={3} marginTop={1} flexShrink={0}>
        <markdown
          syntaxStyle={syntax()}
          streaming={true}
          internalBlockMode="top-level"
          content={props.part.text.trim()}
          tableOptions={{ style: "grid" }}
          conceal={ctx.conceal()}
          fg={theme.markdownText}
          bg={theme.background}
        />
      </box>
    </Show>
  )
}

function PlanPart(props: { part: PlanPartData; onClick: (part: PlanPartData) => void }) {
  const ctx = use()
  const i18n = useI18n()
  const { theme, syntax } = useTheme()
  const [hover, setHover] = createSignal(false)
  return (
    <Show when={props.part.text.trim()}>
      <box
        ref={(el: BoxRenderable) => alwaysSeparate.add(el)}
        border={["left"]}
        borderColor={theme.accent}
        backgroundColor={theme.backgroundPanel}
        marginTop={1}
        flexShrink={0}
        customBorderChars={SplitBorder.customBorderChars}
      >
        <box
          onMouseOver={() => setHover(true)}
          onMouseOut={() => setHover(false)}
          onMouseUp={() => props.onClick(props.part)}
          paddingLeft={2}
          paddingRight={2}
          paddingTop={1}
          paddingBottom={1}
          backgroundColor={hover() ? theme.backgroundElement : theme.backgroundPanel}
          flexShrink={0}
        >
          <text fg={theme.text} attributes={TextAttributes.BOLD}>
            {i18n.t("plan.proposed_title")}
          </text>
          <box paddingTop={1}>
            <markdown
              syntaxStyle={syntax()}
              streaming={true}
              internalBlockMode="top-level"
              content={props.part.text.trim()}
              tableOptions={{ style: "grid" }}
              conceal={ctx.conceal()}
              fg={theme.markdownText}
            />
          </box>
        </box>
      </box>
    </Show>
  )
}

// Pending messages moved to individual tool pending functions

function ToolPart(props: { last: boolean; part: ToolPart; message: AssistantMessage }) {
  const ctx = use()
  const display = createMemo(() => toolDisplay(props.part.tool))

  const shouldHide = createMemo(() =>
    toolDetailsHidden(ctx.showDetails(), props.part.tool, props.part.state, ctx.tui.tool_display),
  )

  const toolprops = {
    get metadata() {
      return props.part.state.status === "pending" ? {} : (props.part.state.metadata ?? {})
    },
    get input() {
      return props.part.state.input ?? {}
    },
    get output() {
      return props.part.state.status === "completed" ? props.part.state.output : undefined
    },
    get tool() {
      return props.part.tool
    },
    get part() {
      return props.part
    },
  }

  return (
    <Show when={!shouldHide()}>
      <Switch>
        <Match when={display() === "bash"}>
          <Shell {...toolprops} />
        </Match>
        <Match when={display() === "glob"}>
          <Glob {...toolprops} />
        </Match>
        <Match when={display() === "read"}>
          <Read {...toolprops} />
        </Match>
        <Match when={display() === "grep"}>
          <Grep {...toolprops} />
        </Match>
        <Match when={display() === "webfetch"}>
          <WebFetch {...toolprops} />
        </Match>
        <Match when={display() === "websearch"}>
          <WebSearch {...toolprops} />
        </Match>
        <Match when={display() === "write"}>
          <Write {...toolprops} />
        </Match>
        <Match when={display() === "edit"}>
          <Edit {...toolprops} />
        </Match>
        <Match when={display() === "task"}>
          <Task {...toolprops} />
        </Match>
        <Match when={display() === "execute"}>
          <Execute {...toolprops} />
        </Match>
        <Match when={display() === "apply_patch"}>
          <ApplyPatch {...toolprops} />
        </Match>
        <Match when={display() === "todowrite"}>
          <TodoWrite {...toolprops} />
        </Match>
        <Match when={display() === "question"}>
          <Question {...toolprops} compact={ctx.tui.tool_display === "compact"} />
        </Match>
        <Match when={display() === "request_user_input"}>
          <RequestUserInput {...toolprops} compact={ctx.tui.tool_display === "compact"} />
        </Match>
        <Match when={display() === "skill"}>
          <Skill {...toolprops} />
        </Match>
        <Match when={true}>
          <GenericTool {...toolprops} />
        </Match>
      </Switch>
    </Show>
  )
}

type CompactExploreKind = "read" | "search" | "web" | "write" | "edit" | "create" | "delete" | "move" | "patch"

function CompactExplore(props: { part: CompactExplorePart }) {
  const ctx = use()
  const { theme } = useTheme()
  const pathFormatter = usePathFormatter()
  const renderer = useRenderer()
  const [expanded, setExpanded] = createSignal(false)
  const errors = createMemo(() =>
    props.part.parts.flatMap((part) => (part.state.status === "error" ? [part.state.error] : [])),
  )
  const status = createMemo(() => {
    if (props.part.parts.some((part) => part.state.status === "error")) return theme.error
    if (props.part.parts.every((part) => part.state.status === "completed")) return theme.success
    return theme.textMuted
  })
  const rows = createMemo(() => compactToolRows(props.part.parts, (value) => pathFormatter.format(value)))
  const fullText = createMemo(() =>
    rows()
      .map((row) => `${compactExploreLabel(row.key)} ${row.labels}`)
      .join("\n"),
  )
  const collapsed = createMemo(() => collapseToolText(fullText(), Math.max(4, ctx.width - 6)))
  const expandable = createMemo(() => collapsed().overflow || errors().length > 0)

  return (
    <InlineToolRow
      icon={errors().length ? "×" : "•"}
      iconColor={status()}
      color={theme.textMuted}
      complete={true}
      pending=""
      dense={true}
      onMouseUp={() => {
        if (renderer.getSelection()?.getSelectedText()) return
        if (!expandable()) return
        setExpanded((previous) => !previous)
      }}
      details={
        <>
          <Show when={expanded()}>
            <For each={rows().slice(1)}>
              {(row) => (
                <box flexDirection="row">
                  <text width={INLINE_TOOL_ICON_WIDTH} fg={status()}>
                    {errors().length ? "×" : "•"}
                  </text>
                  <text flexGrow={1} fg={theme.textMuted}>
                    {compactExploreLabel(row.key)} {row.labels}
                  </text>
                </box>
              )}
            </For>
            <For each={errors()}>
              {(error) => (
                <text paddingLeft={INLINE_TOOL_ICON_WIDTH} fg={theme.error}>
                  {error}
                </text>
              )}
            </For>
          </Show>
        </>
      }
      compactText={fullText()}
      compactWidth={Math.max(4, ctx.width - 6)}
      expanded={expanded()}
    >
      {`${compactExploreLabel(rows()[0]?.key ?? "read")} ${rows()[0]?.labels ?? ""}`}
    </InlineToolRow>
  )
}

function compactExploreLabel(key: CompactExploreKind) {
  return {
    read: t(Locale.language(), "tui.compact_read"),
    search: t(Locale.language(), "tui.compact_search"),
    web: t(Locale.language(), "tui.compact_web"),
    write: t(Locale.language(), "tui.compact_write"),
    edit: t(Locale.language(), "tui.compact_edit"),
    create: t(Locale.language(), "tui.compact_create"),
    delete: t(Locale.language(), "tui.compact_delete"),
    move: t(Locale.language(), "tui.compact_move"),
    patch: t(Locale.language(), "tui.compact_patch"),
  }[key]
}

export function compactToolRows(parts: ToolPart[], formatPath: (value: string | undefined) => string) {
  const entries = parts.flatMap((part): { key: CompactExploreKind; label: string }[] => {
    const display = toolDisplay(part.tool)
    if (display === "read") {
      return [{ key: "read", label: path.basename(formatPath(stringValue(part.state.input.filePath))) }]
    }
    if (display === "glob" || display === "grep") {
      return [{ key: "search", label: stringValue(part.state.input.pattern) ?? part.tool }]
    }
    if (display === "webfetch") {
      return [{ key: "web", label: stringValue(part.state.input.url) ?? part.tool }]
    }
    if (display === "websearch") {
      return [{ key: "web", label: stringValue(part.state.input.query) ?? part.tool }]
    }
    if (display === "write" || display === "edit") {
      return [{ key: display, label: formatPath(stringValue(part.state.input.filePath)) }]
    }

    const files = parseApplyPatchFiles(toolMetadata(part).files)
    if (!files.length) return [{ key: "patch", label: part.tool }]
    return files.map((file) => {
      const key: CompactExploreKind =
        file.type === "add" ? "create" : file.type === "delete" ? "delete" : file.type === "move" ? "move" : "edit"
      const source = formatPath(file.filePath)
      const target = formatPath(file.movePath ?? file.relativePath)
      return { key, label: file.type === "move" ? `${source} → ${target}` : source }
    })
  })
  const groups = entries.reduce((result, entry) => {
    const labels = result.get(entry.key)
    if (labels) labels.push(entry.label)
    else result.set(entry.key, [entry.label])
    return result
  }, new Map<CompactExploreKind, string[]>())
  return [...groups].map(([key, labels]) => ({
    key,
    labels: [...new Set(labels)].join(", "),
  }))
}

type ToolProps = {
  input: Record<string, unknown>
  metadata: Record<string, unknown>
  tool: string
  output?: string
  part: ToolPart
}

function toolTitle(tool: string) {
  return builtinToolDisplayName(Locale.language(), tool) ?? tool
}

function GenericTool(props: ToolProps) {
  const { theme } = useTheme()
  const ctx = use()
  const output = createMemo(() => props.output?.trim() ?? "")
  const label = createMemo(() => [toolTitle(props.tool), input(props.input)].filter(Boolean).join(" "))
  const [expanded, setExpanded] = createSignal(false)
  const maxLines = 3
  const maxChars = createMemo(() => maxLines * Math.max(20, ctx.width - 6))
  const collapsed = createMemo(() => collapseToolOutput(output(), maxLines, maxChars()))
  const limited = createMemo(() => {
    if (expanded() || !collapsed().overflow) return output()
    return collapsed().output
  })
  const compactStatus = createMemo(() => {
    if (props.part.state.status === "error") return theme.error
    if (props.part.state.status === "completed") return theme.success
    return theme.textMuted
  })

  return (
    <Show
      when={props.output && ctx.showGenericToolOutput()}
      fallback={
        <InlineTool
          icon={ctx.tui.tool_display === "compact" ? "•" : "⚙"}
          iconColor={ctx.tui.tool_display === "compact" ? compactStatus() : undefined}
          pending={t(Locale.language(), "tui.writing_command")}
          complete={props.part.state.status === "completed"}
          part={props.part}
          compactText={label()}
        >
          {label()}
        </InlineTool>
      }
    >
      <BlockTool
        title={`# ${label()}`}
        part={props.part}
        onClick={collapsed().overflow ? () => setExpanded((prev) => !prev) : undefined}
      >
        <box gap={1}>
          <text fg={theme.text}>{limited()}</text>
          <Show when={collapsed().overflow}>
            <text fg={theme.textMuted}>
              {expanded() ? t(Locale.language(), "tui.click_collapse") : t(Locale.language(), "tui.click_expand")}
            </text>
          </Show>
        </box>
      </BlockTool>
    </Show>
  )
}

function InlineTool(props: {
  icon: string
  iconColor?: RGBA
  color?: RGBA
  complete: unknown
  pending: string
  failure?: string
  spinner?: boolean
  separate?: boolean
  dense?: boolean
  compactText?: string
  expandable?: boolean
  children: JSX.Element
  part: ToolPart
  onClick?: () => void
  details?: JSX.Element
}) {
  const { theme } = useTheme()
  const ctx = use()
  const sync = useSync()
  const renderer = useRenderer()
  const [hover, setHover] = createSignal(false)
  const [expanded, setExpanded] = createSignal(false)

  const permission = createMemo(() => {
    const callID = sync.data.permission[ctx.sessionID]?.at(0)?.tool?.callID
    if (!callID) return false
    return callID === props.part.callID
  })

  const error = createMemo(() => (props.part.state.status === "error" ? props.part.state.error : undefined))

  const denied = createMemo(
    () =>
      error()?.includes("QuestionRejectedError") ||
      error()?.includes("rejected permission") ||
      error()?.includes("specified a rule") ||
      error()?.includes("user dismissed"),
  )

  const failed = createMemo(() => Boolean(error() && !denied()))
  const compact = createMemo(() => {
    if (ctx.tui.tool_display !== "compact" || props.compactText === undefined) return
    return collapseToolText(props.compactText, Math.max(4, ctx.width - 6))
  })
  const expandable = createMemo(() => Boolean(compact()?.overflow || props.expandable || failed()))
  const clickable = createMemo(() => Boolean(props.onClick || expandable()))
  const fg = createMemo(() => {
    if (props.color) return props.color
    if (permission()) return theme.warning
    if (failed()) return theme.error
    if (hover() && clickable()) return theme.text
    if (props.complete) return theme.textMuted
    return theme.text
  })

  return (
    <InlineToolRow
      icon={props.icon}
      iconColor={props.iconColor}
      color={fg()}
      errorColor={theme.error}
      failed={failed()}
      denied={Boolean(denied())}
      error={error()}
      errorExpanded={expanded()}
      complete={props.complete}
      pending={props.pending}
      failure={props.failure}
      spinner={props.spinner}
      separate={props.separate}
      dense={props.dense ?? ctx.tui.tool_display === "compact"}
      onMouseOver={() => clickable() && setHover(true)}
      onMouseOut={() => setHover(false)}
      onMouseUp={() => {
        if (renderer.getSelection()?.getSelectedText()) return
        if (expandable()) {
          setExpanded((value) => !value)
          return
        }
        props.onClick?.()
      }}
      details={<Show when={ctx.tui.tool_display !== "compact" || expanded()}>{props.details}</Show>}
      compactText={ctx.tui.tool_display === "compact" ? props.compactText : undefined}
      compactWidth={Math.max(4, ctx.width - 6)}
      expanded={expanded()}
    >
      {props.children}
    </InlineToolRow>
  )
}

export function InlineToolRow(props: {
  icon: string
  iconColor?: RGBA
  color?: RGBA
  errorColor?: RGBA
  failed?: boolean
  denied?: boolean
  error?: string
  errorExpanded?: boolean
  complete: unknown
  pending: string
  failure?: string
  spinner?: boolean
  separate?: boolean
  dense?: boolean
  compactText?: string
  compactWidth?: number
  expanded?: boolean
  children: JSX.Element
  onMouseOver?: () => void
  onMouseOut?: () => void
  onMouseUp?: () => void
  details?: JSX.Element
}) {
  const compact = createMemo(() => {
    if (props.compactText === undefined || props.compactWidth === undefined) return
    return collapseToolText(props.compactText, props.compactWidth)
  })

  return (
    <box
      paddingLeft={3}
      onMouseOver={props.onMouseOver}
      onMouseOut={props.onMouseOut}
      onMouseUp={props.onMouseUp}
      ref={(el: BoxRenderable) => {
        if (props.separate) alwaysSeparate.add(el)
        setPreLayoutSiblingMargin(el, (previous) => {
          return props.separate ||
            (previous instanceof BoxRenderable &&
              (alwaysSeparate.has(previous) || (!props.dense && previous.height > 1)))
            ? 1
            : 0
        })
      }}
    >
      <Switch>
        <Match when={props.spinner}>
          <Spinner
            color={props.color}
            wrapMode={compact() && !props.expanded ? "none" : undefined}
            children={compact() && !props.expanded ? compact()!.text : props.children}
          />
        </Match>
        <Match when={true}>
          <Show
            fallback={
              <text
                paddingLeft={3}
                fg={props.color}
                attributes={props.denied ? TextAttributes.STRIKETHROUGH : undefined}
              >
                ~ {props.pending}
              </text>
            }
            when={props.complete || props.failed}
          >
            <box flexDirection="row">
              <text
                width={INLINE_TOOL_ICON_WIDTH}
                fg={props.failed ? props.errorColor : (props.iconColor ?? props.color)}
                attributes={props.denied ? TextAttributes.STRIKETHROUGH : undefined}
              >
                {props.failed && props.icon === "•" ? "×" : props.icon}
              </text>
              <text
                flexGrow={1}
                fg={props.failed ? props.errorColor : props.color}
                wrapMode={compact() && !props.expanded ? "none" : undefined}
                attributes={props.denied ? TextAttributes.STRIKETHROUGH : undefined}
              >
                {props.failed && !props.complete
                  ? (props.failure ?? props.children)
                  : compact() && !props.expanded
                    ? compact()!.text
                    : props.children}
              </text>
            </box>
          </Show>
        </Match>
      </Switch>
      <Show when={props.failed && props.errorExpanded}>
        <box paddingLeft={INLINE_TOOL_ICON_WIDTH}>
          <text fg={props.errorColor}>{props.error}</text>
        </box>
      </Show>
      {props.details}
    </box>
  )
}

function BlockTool(props: {
  title?: string
  children: JSX.Element
  onClick?: () => void
  part?: ToolPart
  spinner?: boolean
}) {
  const { theme } = useTheme()
  const renderer = useRenderer()
  const [hover, setHover] = createSignal(false)
  const error = createMemo(() => (props.part?.state.status === "error" ? props.part.state.error : undefined))
  return (
    <box
      ref={(el: BoxRenderable) => alwaysSeparate.add(el)}
      border={["left"]}
      paddingTop={1}
      paddingBottom={1}
      paddingLeft={2}
      marginTop={1}
      gap={1}
      backgroundColor={hover() ? theme.backgroundMenu : theme.backgroundPanel}
      customBorderChars={SplitBorder.customBorderChars}
      borderColor={theme.background}
      onMouseOver={() => props.onClick && setHover(true)}
      onMouseOut={() => setHover(false)}
      onMouseUp={() => {
        if (renderer.getSelection()?.getSelectedText()) return
        props.onClick?.()
      }}
    >
      <Show when={props.title}>
        {(title) => (
          <Show
            when={props.spinner}
            fallback={
              <text paddingLeft={3} fg={theme.textMuted}>
                {title()}
              </text>
            }
          >
            <Spinner color={theme.textMuted}>{title().replace(/^# /, "")}</Spinner>
          </Show>
        )}
      </Show>
      {props.children}
      <Show when={error()}>
        <text fg={theme.error}>{error()}</text>
      </Show>
    </box>
  )
}

export function shellCommandSucceeded(state: ToolPart["state"]) {
  if (state.status === "error") return false
  if (state.status !== "completed") return

  const exit = state.metadata?.exit
  if (exit === 0) return true
  if (exit === null || numberValue(exit) !== undefined) return false
}

export function toolDetailsHidden(
  showDetails: boolean,
  tool: string,
  state: ToolPart["state"],
  display?: "compact" | "detailed",
) {
  if (display === "compact" && isUserInputTool(tool) && state.status === "completed") return false
  return !showDetails && state.status === "completed" && !(tool === "bash" && shellCommandSucceeded(state) === false)
}

function Shell(props: ToolProps) {
  const { theme } = useTheme()
  const pathFormatter = usePathFormatter()
  const ctx = use()
  const succeeded = createMemo(() => shellCommandSucceeded(props.part.state))
  const command = createMemo(() => stringValue(props.input.command) ?? "")
  const commandLabel = createMemo(() => t(Locale.language(), "tui.execute_command", { command: command() }))
  const running = createMemo(() => props.part.state.status === "running")
  const complete = createMemo(() => props.part.state.status === "completed" || props.part.state.status === "error")
  const statusColor = createMemo(() => {
    if (props.part.state.status === "error" || succeeded() === false) return theme.error
    if (props.part.state.status === "completed") return theme.success
    return theme.textMuted
  })
  const output = createMemo(() => stripAnsi(stringValue(props.metadata.output)?.trim() ?? ""))
  const [expanded, setExpanded] = createSignal(false)
  const maxLines = 10
  const maxChars = createMemo(() => maxLines * Math.max(20, ctx.width - 6))
  const collapsed = createMemo(() => collapseToolOutput(output(), maxLines, maxChars()))
  const limited = createMemo(() => {
    if (expanded() || !collapsed().overflow) return output()
    return collapsed().output
  })

  const workdirDisplay = createMemo(() => {
    const workdir = stringValue(props.input.workdir)
    if (!workdir || workdir === ".") return undefined
    const formatted = pathFormatter.format(workdir)
    if (formatted === ".") return undefined
    return formatted
  })

  const title = createMemo(() => {
    const wd = workdirDisplay()
    if (!wd) return
    return `# ${t(Locale.language(), "tui.running_in", { dir: wd })}`
  })

  return (
    <Switch>
      <Match when={ctx.tui.tool_display === "compact"}>
        <InlineTool
          icon={props.part.state.status === "error" || succeeded() === false ? "×" : "•"}
          iconColor={statusColor()}
          pending={t(Locale.language(), "tui.writing_command")}
          complete={complete()}
          spinner={running()}
          part={props.part}
          compactText={commandLabel()}
          expandable={Boolean(output())}
          details={
            <Show when={output()}>
              <text paddingLeft={INLINE_TOOL_ICON_WIDTH} fg={theme.textMuted}>
                {output()}
              </text>
            </Show>
          }
        >
          {commandLabel()}
        </InlineTool>
      </Match>
      <Match when={stringValue(props.metadata.output) !== undefined}>
        <BlockTool
          title={title()}
          part={props.part}
          onClick={collapsed().overflow ? () => setExpanded((prev) => !prev) : undefined}
        >
          <box gap={1}>
            <Switch>
              <Match when={running()}>
                <Spinner color={theme.text}>{commandLabel()}</Spinner>
              </Match>
              <Match when={complete()}>
                <box flexDirection="row" gap={1}>
                  <text fg={statusColor()} attributes={TextAttributes.BOLD}>
                    {props.part.state.status === "error" || succeeded() === false ? "×" : "•"}
                  </text>
                  <text fg={theme.text}>{commandLabel()}</text>
                </box>
              </Match>
              <Match when={true}>
                <text fg={theme.text}>{commandLabel()}</text>
              </Match>
            </Switch>
            <Show when={output()}>
              <text fg={theme.text}>{limited()}</text>
            </Show>
            <Show when={collapsed().overflow}>
              <text fg={theme.textMuted}>
                {expanded() ? t(Locale.language(), "tui.click_collapse") : t(Locale.language(), "tui.click_expand")}
              </text>
            </Show>
          </box>
        </BlockTool>
      </Match>
      <Match when={true}>
        <InlineTool
          icon={props.part.state.status === "error" || succeeded() === false ? "×" : "•"}
          iconColor={statusColor()}
          pending={t(Locale.language(), "tui.writing_command")}
          complete={complete()}
          spinner={running()}
          part={props.part}
          compactText={commandLabel()}
        >
          {commandLabel()}
        </InlineTool>
      </Match>
    </Switch>
  )
}

function Write(props: ToolProps) {
  const { theme, syntax } = useTheme()
  const pathFormatter = usePathFormatter()
  const label = createMemo(() =>
    t(Locale.language(), "tui.write_file", { path: pathFormatter.format(stringValue(props.input.filePath)) }),
  )
  const code = createMemo(() => {
    return stringValue(props.input.content) ?? ""
  })

  return (
    <Switch>
      <Match when={props.metadata.diagnostics !== undefined}>
        <BlockTool
          title={`# ${t(Locale.language(), "tui.wrote_file", { path: pathFormatter.format(stringValue(props.input.filePath)) })}`}
          part={props.part}
        >
          <line_number fg={theme.textMuted} minWidth={3} paddingRight={1}>
            <code
              conceal={false}
              fg={theme.text}
              filetype={filetype(stringValue(props.input.filePath))}
              syntaxStyle={syntax()}
              content={code()}
            />
          </line_number>
          <Diagnostics diagnostics={props.metadata.diagnostics} filePath={stringValue(props.input.filePath) ?? ""} />
        </BlockTool>
      </Match>
      <Match when={true}>
        <InlineTool
          icon="←"
          pending={t(Locale.language(), "tui.preparing_write")}
          complete={stringValue(props.input.filePath)}
          part={props.part}
          compactText={label()}
        >
          {label()}
        </InlineTool>
      </Match>
    </Switch>
  )
}

function Glob(props: ToolProps) {
  const pathFormatter = usePathFormatter()
  const label = createMemo(() =>
    [
      t(Locale.language(), "tui.glob", { pattern: stringValue(props.input.pattern) }),
      stringValue(props.input.path)
        ? t(Locale.language(), "tui.in_path", { path: pathFormatter.format(stringValue(props.input.path)) })
        : undefined,
      numberValue(props.metadata.count) !== undefined
        ? `(${t(Locale.language(), "tui.match_count", { count: numberValue(props.metadata.count) })})`
        : undefined,
    ]
      .filter((value): value is string => value !== undefined)
      .join(" "),
  )
  return (
    <InlineTool
      icon="✱"
      pending={t(Locale.language(), "tui.finding_files")}
      complete={stringValue(props.input.pattern)}
      part={props.part}
      compactText={label()}
    >
      {label()}
    </InlineTool>
  )
}

function Read(props: ToolProps) {
  const { theme } = useTheme()
  const pathFormatter = usePathFormatter()
  const label = createMemo(() =>
    `${t(Locale.language(), "tui.read_file", { path: pathFormatter.format(stringValue(props.input.filePath)) })} ${input(props.input, ["filePath"])}`.trim(),
  )
  const isRunning = createMemo(() => props.part.state.status === "running")
  const loaded = createMemo(() => {
    if (props.part.state.status !== "completed") return []
    if (props.part.state.time.compacted) return []
    const value = props.metadata.loaded
    if (!value || !Array.isArray(value)) return []
    return value.filter((p): p is string => typeof p === "string")
  })
  return (
    <>
      <InlineTool
        icon="→"
        pending={t(Locale.language(), "tui.reading_file")}
        complete={stringValue(props.input.filePath)}
        spinner={isRunning()}
        part={props.part}
        compactText={label()}
      >
        {label()}
      </InlineTool>
      <For each={loaded()}>
        {(filepath) => (
          <box paddingLeft={3}>
            <text paddingLeft={3} fg={theme.textMuted}>
              ↳ {t(Locale.language(), "tui.loaded_file", { path: pathFormatter.format(filepath) })}
            </text>
          </box>
        )}
      </For>
    </>
  )
}

function Grep(props: ToolProps) {
  const pathFormatter = usePathFormatter()
  const label = createMemo(() =>
    [
      t(Locale.language(), "tui.grep", { pattern: stringValue(props.input.pattern) }),
      stringValue(props.input.path)
        ? t(Locale.language(), "tui.in_path", { path: pathFormatter.format(stringValue(props.input.path)) })
        : undefined,
      numberValue(props.metadata.matches) !== undefined
        ? `(${t(Locale.language(), "tui.match_count", { count: numberValue(props.metadata.matches) })})`
        : undefined,
    ]
      .filter((value): value is string => value !== undefined)
      .join(" "),
  )
  return (
    <InlineTool
      icon="✱"
      pending={t(Locale.language(), "tui.searching_content")}
      complete={stringValue(props.input.pattern)}
      part={props.part}
      compactText={label()}
    >
      {label()}
    </InlineTool>
  )
}

function WebFetch(props: ToolProps) {
  const label = createMemo(() => t(Locale.language(), "tui.webfetch_tool", { url: stringValue(props.input.url) }))
  return (
    <InlineTool
      icon="%"
      pending={t(Locale.language(), "tui.fetching_web")}
      complete={stringValue(props.input.url)}
      part={props.part}
      compactText={label()}
    >
      {label()}
    </InlineTool>
  )
}

function WebSearch(props: ToolProps) {
  const label = createMemo(() =>
    [
      `${webSearchProviderLabel(props.metadata.provider)} "${stringValue(props.input.query)}"`,
      numberValue(props.metadata.numResults) !== undefined
        ? `(${t(Locale.language(), "tui.results_count", { count: numberValue(props.metadata.numResults) })})`
        : undefined,
    ]
      .filter((value): value is string => value !== undefined)
      .join(" "),
  )
  return (
    <InlineTool
      icon="◈"
      pending={t(Locale.language(), "tui.searching_web")}
      complete={stringValue(props.input.query)}
      part={props.part}
      compactText={label()}
    >
      {label()}
    </InlineTool>
  )
}

function Task(props: ToolProps) {
  const i18n = useI18n()
  const { theme } = useTheme()
  const { navigate } = useRoute()
  const sync = useSync()
  const dialog = useDialog()

  onMount(() => {
    const sessionID = stringValue(props.metadata.sessionId)
    if (sessionID && !sync.data.message[sessionID]?.length) void sync.session.sync(sessionID)
  })

  const sessionID = createMemo(() => stringValue(props.metadata.sessionId))
  const messages = createMemo(() => sync.data.message[sessionID() ?? ""] ?? [])

  const tools = createMemo(() => {
    return messages().flatMap((msg) =>
      (sync.data.part[msg.id] ?? [])
        .filter((part): part is ToolPart => part.type === "tool")
        .map((part) => ({ tool: part.tool, state: part.state })),
    )
  })

  const current = createMemo(() =>
    tools().findLast((x) => (x.state.status === "running" || x.state.status === "completed") && x.state.title),
  )

  const status = createMemo(() => sync.data.session_status[sessionID() ?? ""])
  const isRunning = createMemo(() => {
    const value = status()
    return (
      props.part.state.status === "running" ||
      (props.metadata.background === true && value !== undefined && value.type !== "idle")
    )
  })
  const retry = createMemo(() => {
    const value = status()
    if (value?.type !== "retry") return
    return value
  })

  const duration = createMemo(() => {
    const first = messages().find((x) => x.role === "user")?.time.created
    const assistant = messages().findLast((x) => x.role === "assistant")?.time.completed
    if (!first || !assistant) return 0
    return assistant - first
  })

  const content = createMemo(() => {
    const description = stringValue(props.input.description)
    if (!description) return ""
    let content = [
      formatSubagentTitle(
        Locale.titlecase(stringValue(props.input.subagent_type) ?? i18n.t("agent.general")),
        description,
        props.metadata.background === true,
      ),
    ]

    const retrying = retry()
    if (isRunning() && retrying) {
      content.push(`↳ ${formatSubagentRetry(retrying.attempt, Locale.truncate(retrying.message, 80))}`)
    } else if (isRunning() && tools().length > 0) {
      if (current()) {
        const state = current()!.state
        const title = state.status === "running" || state.status === "completed" ? state.title : undefined
        content.push(`↳ ${toolTitle(current()!.tool)} ${title}`)
      } else content.push(`↳ ${formatSubagentToolcalls(tools().length)}`)
    }

    if (!isRunning() && props.part.state.status === "completed") {
      content.push(`↳ ${formatCompletedSubagentDetail(tools().length, Locale.duration(duration()))}`)
    }

    return content.join("\n")
  })

  return (
    <InlineTool
      icon={props.part.state.status === "completed" ? "✓" : "│"}
      separate={true}
      color={retry() ? theme.error : undefined}
      spinner={isRunning()}
      complete={stringValue(props.input.description)}
      pending={t(Locale.language(), "tui.delegating")}
      part={props.part}
      onClick={() => {
        if (sessionID()) {
          navigate({ type: "session", sessionID: sessionID()! })
        }
        const status = retry()
        if (status) void DialogAlert.show(dialog, t(Locale.language(), "tui.retry_error"), status.message)
      }}
    >
      {content()}
    </InlineTool>
  )
}

export function formatSubagentToolcalls(count: number) {
  return t(Locale.language(), "tui.toolcalls", { count })
}

export function formatSubagentTitle(agent: string, description: string, background: boolean) {
  return `${agent} ${t(Locale.language(), "tui.task")}${background ? ` (${t(Locale.language(), "tui.background")})` : ""} — ${description}`
}

export function formatSubagentRetry(attempt: number, message: string) {
  return t(Locale.language(), "tui.retrying", { attempt, message })
}

export function formatCompletedSubagentDetail(toolcalls: number, duration: string) {
  if (toolcalls === 0) return duration
  return `${formatSubagentToolcalls(toolcalls)} · ${duration}`
}

type ExecuteCall = { tool: string; status: "running" | "completed" | "error"; input?: Record<string, unknown> }

function executeCalls(value: unknown): ExecuteCall[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((call) => {
    const item = recordValue(call)
    const tool = stringValue(item?.tool)
    const status = stringValue(item?.status)
    if (!tool || !status || !["running", "completed", "error"].includes(status)) return []
    return [{ tool, status: status as ExecuteCall["status"], input: recordValue(item?.input) }]
  })
}

// The `execute` tool streams child tool calls through metadata, not a child session like Task.
function Execute(props: ToolProps) {
  const ctx = use()
  const { theme } = useTheme()
  const isLoading = createMemo(() => props.part.state.status === "pending" || props.part.state.status === "running")
  const calls = createMemo(() => executeCalls(props.metadata.toolCalls))
  const output = createMemo(() => stripAnsi(props.output?.trim() ?? ""))
  const hasRuntimeError = createMemo(() => props.metadata.error === true)
  const outputPreview = createMemo(() => collapseToolOutput(output(), 4, 4 * Math.max(20, ctx.width - 6)).output)
  const showOutput = createMemo(() => output() && hasRuntimeError())
  const content = createMemo(() => {
    const lines = [toolTitle("execute")]
    for (const call of calls()) {
      const args = input(call.input ?? {})
      lines.push(
        `↳ ${toolTitle(call.tool)}${args ? ` ${args}` : ""}${call.status === "error" ? t(Locale.language(), "tui.execute_failed") : ""}`,
      )
    }
    return lines.join("\n")
  })

  return (
    <>
      <InlineTool
        icon={hasRuntimeError() ? "✗" : props.part.state.status === "completed" ? "✓" : "│"}
        color={hasRuntimeError() ? theme.error : undefined}
        spinner={isLoading()}
        pending={toolTitle("execute")}
        complete={true}
        part={props.part}
        compactText={content()}
      >
        {content()}
      </InlineTool>
      <Show when={showOutput()}>
        <box paddingLeft={3}>
          <For each={outputPreview().split("\n")}>
            {(line, index) => (
              <text paddingLeft={3} fg={theme.error}>
                {index() === 0 ? "↳ " : "  "}
                {line}
              </text>
            )}
          </For>
        </box>
      </Show>
    </>
  )
}

function Edit(props: ToolProps) {
  const ctx = use()
  const { theme, syntax } = useTheme()
  const pathFormatter = usePathFormatter()
  const label = createMemo(() =>
    `${t(Locale.language(), "tui.edit_file", { path: pathFormatter.format(stringValue(props.input.filePath)) })} ${input({ replaceAll: props.input.replaceAll })}`.trim(),
  )

  const view = createMemo(() => {
    const diffStyle = ctx.tui.diff_style
    if (diffStyle === "stacked") return "unified"
    // Default to "auto" behavior
    return ctx.width > 120 ? "split" : "unified"
  })

  const ft = createMemo(() => filetype(stringValue(props.input.filePath)))

  const diffContent = createMemo(() => stringValue(props.metadata.diff) ?? "")
  const hasDiagnostics = createMemo(
    () => parseDiagnostics(props.metadata.diagnostics, stringValue(props.input.filePath) ?? "").length > 0,
  )

  return (
    <Switch>
      <Match when={diffContent().trim() || hasDiagnostics()}>
        <BlockTool
          title={`← ${t(Locale.language(), "tui.edit_file", { path: pathFormatter.format(stringValue(props.input.filePath)) })}`}
          part={props.part}
        >
          <box paddingLeft={1}>
            <diff
              diff={diffContent()}
              view={view()}
              filetype={ft()}
              syntaxStyle={syntax()}
              showLineNumbers={true}
              width="100%"
              wrapMode={ctx.diffWrapMode()}
              fg={theme.text}
              addedBg={theme.diffAddedBg}
              removedBg={theme.diffRemovedBg}
              contextBg={theme.diffContextBg}
              addedSignColor={theme.diffHighlightAdded}
              removedSignColor={theme.diffHighlightRemoved}
              lineNumberFg={theme.diffLineNumber}
              lineNumberBg={theme.diffContextBg}
              addedLineNumberBg={theme.diffAddedLineNumberBg}
              removedLineNumberBg={theme.diffRemovedLineNumberBg}
            />
          </box>
          <Diagnostics diagnostics={props.metadata.diagnostics} filePath={stringValue(props.input.filePath) ?? ""} />
        </BlockTool>
      </Match>
      <Match when={true}>
        <InlineTool
          icon="←"
          pending={t(Locale.language(), "tui.preparing_edit")}
          complete={stringValue(props.input.filePath)}
          part={props.part}
          compactText={label()}
        >
          {label()}
        </InlineTool>
      </Match>
    </Switch>
  )
}

function ApplyPatch(props: ToolProps) {
  const ctx = use()
  const { theme, syntax } = useTheme()
  const pathFormatter = usePathFormatter()

  const files = createMemo(() => parseApplyPatchFiles(props.metadata.files))

  const view = createMemo(() => {
    const diffStyle = ctx.tui.diff_style
    if (diffStyle === "stacked") return "unified"
    return ctx.width > 120 ? "split" : "unified"
  })

  function Diff(p: { diff: string; filePath: string }) {
    return (
      <box paddingLeft={1}>
        <diff
          diff={p.diff}
          view={view()}
          filetype={filetype(p.filePath)}
          syntaxStyle={syntax()}
          showLineNumbers={true}
          width="100%"
          wrapMode={ctx.diffWrapMode()}
          fg={theme.text}
          addedBg={theme.diffAddedBg}
          removedBg={theme.diffRemovedBg}
          contextBg={theme.diffContextBg}
          addedSignColor={theme.diffHighlightAdded}
          removedSignColor={theme.diffHighlightRemoved}
          lineNumberFg={theme.diffLineNumber}
          lineNumberBg={theme.diffContextBg}
          addedLineNumberBg={theme.diffAddedLineNumberBg}
          removedLineNumberBg={theme.diffRemovedLineNumberBg}
        />
      </box>
    )
  }

  function title(file: { type: string; relativePath: string; filePath: string; deletions: number; movePath?: string }) {
    if (file.type === "delete") return `# ${t(Locale.language(), "tui.deleted_file", { path: file.relativePath })}`
    if (file.type === "add") return `# ${t(Locale.language(), "tui.created_file", { path: file.relativePath })}`
    if (file.type === "move")
      return `# ${t(Locale.language(), "tui.moved_file", {
        path: pathFormatter.format(file.filePath),
        target: pathFormatter.format(file.movePath ?? file.relativePath),
      })}`
    return `← ${t(Locale.language(), "tui.patched_file", { path: file.relativePath })}`
  }

  return (
    <Switch>
      <Match when={files().length > 0}>
        <For each={files()}>
          {(file) => (
            <BlockTool title={title(file)} part={props.part}>
              <Show
                when={file.type !== "delete"}
                fallback={
                  <text fg={theme.diffRemoved}>
                    -{t(Locale.language(), "tui.line_count", { count: file.deletions })}
                  </text>
                }
              >
                <Diff diff={file.patch} filePath={file.filePath} />
                <Diagnostics diagnostics={props.metadata.diagnostics} filePath={file.movePath ?? file.filePath} />
              </Show>
            </BlockTool>
          )}
        </For>
      </Match>
      <Match when={true}>
        <InlineTool
          icon="%"
          pending={t(Locale.language(), "tui.preparing_patch")}
          failure={t(Locale.language(), "tui.patch_failed")}
          complete={false}
          part={props.part}
          compactText={t(Locale.language(), "tui.patch")}
        >
          {t(Locale.language(), "tui.patch")}
        </InlineTool>
      </Match>
    </Switch>
  )
}

function TodoWrite(props: ToolProps) {
  const todos = createMemo(() => parseTodos(props.input.todos))
  return (
    <Switch>
      <Match when={parseTodos(props.metadata.todos).length}>
        <BlockTool title={`# ${t(Locale.language(), "tui.todos")}`} part={props.part}>
          <box>
            <For each={todos()}>{(todo) => <TodoItem status={todo.status} content={todo.content} />}</For>
          </box>
        </BlockTool>
      </Match>
      <Match when={true}>
        <InlineTool
          icon="⚙"
          pending={t(Locale.language(), "tui.updating_todos")}
          failure={t(Locale.language(), "tui.todo_update_failed")}
          complete={false}
          part={props.part}
          compactText={t(Locale.language(), "tui.updating_todos")}
        >
          {t(Locale.language(), "tui.updating_todos")}
        </InlineTool>
      </Match>
    </Switch>
  )
}

export function Question(props: ToolProps & { compact: boolean }) {
  const { theme } = useTheme()
  const questions = createMemo(() => parseQuestions(props.input.questions))
  const answers = createMemo(() => parseQuestionAnswers(props.metadata.answers))
  const count = createMemo(() => questions().length)
  const results = createMemo(() =>
    questions().map((question, index) => ({ question: question.question, answers: answers()?.[index] ?? [] })),
  )

  return (
    <Switch>
      <Match when={answers() && props.compact}>
        <CompactQuestionResult results={results()} part={props.part} />
      </Match>
      <Match when={answers()}>
        <BlockTool title={`# ${t(Locale.language(), "tool.title.questions", { count: count() })}`} part={props.part}>
          <box gap={1}>
            <For each={questions()}>
              {(q, i) => {
                const value = createMemo(() => splitQuestionAnswer(answers()?.[i()] ?? []))
                return (
                  <box flexDirection="column">
                    <text fg={theme.textMuted}>{q.question}</text>
                    <text fg={theme.text}>
                      {value().answers.length > 0 ? value().answers.join(", ") : t(Locale.language(), "tui.no_answer")}
                    </text>
                    <Show when={value().notes.length > 0}>
                      <text fg={theme.textMuted}>
                        {t(Locale.language(), "question.note_label")}: {value().notes.join("\n")}
                      </text>
                    </Show>
                  </box>
                )
              }}
            </For>
          </box>
        </BlockTool>
      </Match>
      <Match when={true}>
        <InlineTool
          icon="→"
          pending={t(Locale.language(), "tool.asking_questions")}
          complete={count()}
          part={props.part}
          compactText={t(Locale.language(), "tool.asked_questions", { count: count() })}
        >
          {t(Locale.language(), "tool.asked_questions", { count: count() })}
        </InlineTool>
      </Match>
    </Switch>
  )
}

export function RequestUserInput(props: ToolProps & { compact: boolean }) {
  const { theme } = useTheme()
  const questions = createMemo(() => parseRequestUserInputQuestions(props.input.questions))
  const answers = createMemo(() => parseRequestUserInputAnswers(props.metadata.answers))
  const count = createMemo(() => questions().length)
  const results = createMemo(() =>
    questions().map((question) => ({ question: question.question, answers: answers()?.[question.id] ?? [] })),
  )

  return (
    <Switch>
      <Match when={answers() && props.compact}>
        <CompactQuestionResult results={results()} part={props.part} />
      </Match>
      <Match when={answers()}>
        <BlockTool title={`# ${t(Locale.language(), "tool.title.questions", { count: count() })}`} part={props.part}>
          <box gap={1}>
            <For each={results()}>
              {(result) => {
                const value = createMemo(() => splitQuestionAnswer(result.answers))
                return (
                  <box flexDirection="column">
                    <text fg={theme.textMuted}>{result.question}</text>
                    <text fg={theme.text}>
                      {value().answers.length > 0 ? value().answers.join(", ") : t(Locale.language(), "tui.no_answer")}
                    </text>
                    <Show when={value().notes.length > 0}>
                      <text fg={theme.textMuted}>
                        {t(Locale.language(), "question.note_label")}: {value().notes.join("\n")}
                      </text>
                    </Show>
                  </box>
                )
              }}
            </For>
          </box>
        </BlockTool>
      </Match>
      <Match when={true}>
        <InlineTool
          icon="→"
          pending={t(Locale.language(), "tool.asking_questions")}
          complete={props.part.state.status === "completed"}
          part={props.part}
          compactText={t(Locale.language(), "tool.asked_questions", { count: count() })}
        >
          {t(Locale.language(), "tool.asked_questions", { count: count() })}
        </InlineTool>
      </Match>
    </Switch>
  )
}

type QuestionResult = { question: string; answers: ReadonlyArray<string> }

function CompactQuestionResult(props: { results: ReadonlyArray<QuestionResult>; part: ToolPart }) {
  const { theme } = useTheme()
  const answered = createMemo(() => props.results.filter((result) => result.answers.length > 0).length)

  return (
    <InlineToolRow
      icon="•"
      iconColor={theme.textMuted}
      color={theme.textMuted}
      complete={props.part.state.status === "completed"}
      pending={t(Locale.language(), "tool.asking_questions")}
      dense={true}
      details={
        <box flexDirection="column" paddingLeft={2}>
          <For each={props.results}>
            {(result) => {
              const value = createMemo(() => splitQuestionAnswer(result.answers))
              return (
                <box flexDirection="column">
                  <text wrapMode="word" fg={theme.textMuted}>
                    • {result.question}
                    <Show when={result.answers.length === 0}>
                      <span style={{ fg: theme.textMuted }}> {t(Locale.language(), "tui.no_answer")}</span>
                    </Show>
                  </text>
                  <For each={value().answers}>
                    {(answer) => (
                      <box paddingLeft={2}>
                        <text wrapMode="word" fg={theme.textMuted}>
                          {t(Locale.language(), "question.answer_label")}: {answer}
                        </text>
                      </box>
                    )}
                  </For>
                  <For each={value().notes}>
                    {(note) => (
                      <box paddingLeft={2}>
                        <text wrapMode="word" fg={theme.textMuted}>
                          {t(Locale.language(), "question.note_label")}: {note}
                        </text>
                      </box>
                    )}
                  </For>
                </box>
              )
            }}
          </For>
        </box>
      }
    >
      {t(Locale.language(), "tool.questions_answered", { answered: answered(), total: props.results.length })}
    </InlineToolRow>
  )
}

function Skill(props: ToolProps) {
  return (
    <InlineTool
      icon="→"
      pending={t(Locale.language(), "tool.loading_skill")}
      complete={stringValue(props.input.name)}
      part={props.part}
      compactText={t(Locale.language(), "tool.skill_title", { name: stringValue(props.input.name) })}
    >
      {t(Locale.language(), "tool.skill_title", { name: stringValue(props.input.name) })}
    </InlineTool>
  )
}

function Diagnostics(props: { diagnostics: unknown; filePath: string }) {
  const { theme } = useTheme()
  const terminalEnvironment = useTuiTerminalEnvironment()
  const errors = createMemo(() => {
    const normalized = normalizePath(
      typeof props.filePath === "string" ? props.filePath : "",
      terminalEnvironment.platform,
    )
    return parseDiagnostics(props.diagnostics, normalized)
  })

  return (
    <Show when={errors().length}>
      <box>
        <For each={errors()}>
          {(diagnostic) => (
            <text fg={theme.error}>
              {t(Locale.language(), "tui.diagnostic_error", {
                line: diagnostic.range.start.line + 1,
                column: diagnostic.range.start.character + 1,
                message: diagnostic.message,
              })}
            </text>
          )}
        </For>
      </box>
    </Show>
  )
}

function input(input: Record<string, unknown>, omit?: string[]): string {
  const primitives = Object.entries(input).filter(([key, value]) => {
    if (omit?.includes(key)) return false
    return typeof value === "string" || typeof value === "number" || typeof value === "boolean"
  })
  if (primitives.length === 0) return ""
  return `[${primitives.map(([key, value]) => `${key}=${value}`).join(", ")}]`
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined
}

const toolDisplays = new Set([
  "bash",
  "glob",
  "read",
  "grep",
  "webfetch",
  "websearch",
  "write",
  "edit",
  "task",
  "apply_patch",
  "todowrite",
  "question",
  "request_user_input",
  "skill",
  "execute",
])

const userInputTools = new Set(["question", "request_user_input"])

function isUserInputTool(tool: string) {
  return userInputTools.has(tool)
}

export function toolDisplay(tool: string) {
  return toolDisplays.has(tool) ? tool : "generic"
}

function toolMetadata(part: ToolPart) {
  return part.state.status === "pending" ? {} : (part.state.metadata ?? {})
}

export function toolUsesCompactDisplay(part: ToolPart) {
  const display = toolDisplay(part.tool)
  if (["read", "glob", "grep", "webfetch", "websearch"].includes(display)) return true
  const metadata = toolMetadata(part)
  if (display === "write") return metadata.diagnostics === undefined
  if (display === "edit") {
    const filePath = stringValue(part.state.input.filePath) ?? ""
    return !stringValue(metadata.diff)?.trim() && parseDiagnostics(metadata.diagnostics, filePath).length === 0
  }
  if (display !== "apply_patch") return false

  return parseApplyPatchFiles(metadata.files).every((file) => {
    if (file.type !== "delete" && file.patch.trim()) return false
    const target = file.movePath ?? file.filePath
    return parseDiagnostics(metadata.diagnostics, target).length === 0
  })
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return
  return value as Record<string, unknown>
}

export function parseApplyPatchFiles(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const file = recordValue(item)
    if (!file) return []
    const type = stringValue(file.type)
    const relativePath = stringValue(file.relativePath)
    const filePath = stringValue(file.filePath)
    const patch = stringValue(file.patch)
    const deletions = numberValue(file.deletions)
    if (!type || !relativePath || !filePath || patch === undefined || deletions === undefined) return []
    return [{ type, relativePath, filePath, patch, deletions, movePath: stringValue(file.movePath) }]
  })
}

export function parseTodos(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const todo = recordValue(item)
    const status = stringValue(todo?.status)
    const content = stringValue(todo?.content)
    return status && content ? [{ status, content }] : []
  })
}

export function parseQuestions(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const question = stringValue(recordValue(item)?.question)
    return question ? [{ question }] : []
  })
}

export function parseQuestionAnswers(value: unknown) {
  if (!Array.isArray(value)) return
  return value.map((answer) =>
    Array.isArray(answer) ? answer.filter((item): item is string => typeof item === "string") : [],
  )
}

export function parseRequestUserInputQuestions(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    const question = recordValue(item)
    const id = stringValue(question?.id)
    const text = stringValue(question?.question)
    if (!id || !text) return []
    return [{ id, question: text }]
  })
}

export function parseRequestUserInputAnswers(value: unknown) {
  const answers = recordValue(value)
  if (!answers) return
  return Object.fromEntries(
    Object.entries(answers).flatMap(([id, value]) => {
      const answer = recordValue(value)
      if (!Array.isArray(answer?.answers)) return []
      return [[id, answer.answers.filter((item): item is string => typeof item === "string")]]
    }),
  )
}

export function parseDiagnostics(value: unknown, filePath: string) {
  const diagnostics = recordValue(value)?.[filePath]
  if (!Array.isArray(diagnostics)) return []
  return diagnostics
    .flatMap((item) => {
      const diagnostic = recordValue(item)
      const start = recordValue(recordValue(diagnostic?.range)?.start)
      const line = numberValue(start?.line)
      const character = numberValue(start?.character)
      const message = stringValue(diagnostic?.message)
      if (diagnostic?.severity !== 1 || line === undefined || character === undefined || !message) return []
      return [{ range: { start: { line, character } }, message }]
    })
    .slice(0, 3)
}
