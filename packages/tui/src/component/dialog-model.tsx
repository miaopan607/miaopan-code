import { batch, createMemo, createSignal } from "solid-js"
import { reconcile } from "solid-js/store"
import { useLocal } from "../context/local"
import { map, pipe, flatMap, entries, filter, sortBy, take } from "remeda"
import { DialogSelect } from "../ui/dialog-select"
import { useDialog } from "../ui/dialog"
import { createDialogProviderOptions, DialogProvider } from "./dialog-provider"
import { DialogVariant } from "./dialog-variant"
import * as fuzzysort from "fuzzysort"
import { useConnected } from "./use-connected"
import { useSync } from "../context/sync"
import { useI18n } from "../context/i18n"
import { useSDK } from "../context/sdk"
import { useProject } from "../context/project"
import { useToast } from "../ui/toast"
import { canReorderFavorite } from "../util/favorite"

export function DialogModel(props: { providerID?: string }) {
  const local = useLocal()
  const sync = useSync()
  const dialog = useDialog()
  const i18n = useI18n()
  const sdk = useSDK()
  const project = useProject()
  const toast = useToast()
  const [query, setQuery] = createSignal("")
  const [refreshing, setRefreshing] = createSignal(false)

  const connected = useConnected()
  const providers = createDialogProviderOptions()
  const favoriteModels = createMemo(() =>
    connected()
      ? local.model.favorite().filter((item) => {
          const provider = sync.data.provider.find((provider) => provider.id === item.providerID)
          return !!provider?.models[item.modelID]
        })
      : [],
  )

  const showExtra = createMemo(() => connected() && !props.providerID)

  const options = createMemo(() => {
    const needle = query().trim()
    const showSections = showExtra() && needle.length === 0
    const favorites = favoriteModels()
    const recents = local.model.recent()

    function toOptions(items: typeof favorites, category: string) {
      if (!showSections) return []
      return items.flatMap((item) => {
        const provider = sync.data.provider.find((provider) => provider.id === item.providerID)
        if (!provider) return []
        const model = provider.models[item.modelID]
        if (!model) return []
        return [
          {
            key: item,
            value: { providerID: provider.id, modelID: model.id },
            title: model.name ?? item.modelID,
            description: provider.name,
            category,
            disabled: provider.id === "opencode" && model.id.includes("-nano"),
            footer: model.cost?.input === 0 && provider.id === "opencode" ? i18n.t("tui.free") : undefined,
            onSelect: () => {
              onSelect(provider.id, model.id)
            },
          },
        ]
      })
    }

    const favoriteOptions = toOptions(favorites, i18n.t("tui.favorites"))
    const recentOptions = toOptions(
      recents.filter(
        (item) => !favorites.some((fav) => fav.providerID === item.providerID && fav.modelID === item.modelID),
      ),
      i18n.t("tui.recent"),
    )

    const providerOptions = pipe(
      sync.data.provider,
      sortBy(
        (provider) => provider.id !== "opencode",
        (provider) => provider.name,
      ),
      flatMap((provider) =>
        pipe(
          provider.models,
          entries(),
          filter(([_, info]) => info.status !== "deprecated"),
          filter(([_, info]) => (props.providerID ? info.providerID === props.providerID : true)),
          map(([model, info]) => ({
            value: { providerID: provider.id, modelID: model },
            title: info.name ?? model,
            releaseDate: info.release_date,
            description: favorites.some((item) => item.providerID === provider.id && item.modelID === model)
              ? `(${i18n.t("tui.favorite")})`
              : undefined,
            category: connected() ? provider.name : undefined,
            disabled: provider.id === "opencode" && model.includes("-nano"),
            footer: info.cost?.input === 0 && provider.id === "opencode" ? i18n.t("tui.free") : undefined,
            onSelect() {
              onSelect(provider.id, model)
            },
          })),
          filter((option) => {
            if (!showSections) return true
            if (
              favorites.some(
                (item) => item.providerID === option.value.providerID && item.modelID === option.value.modelID,
              )
            )
              return false
            if (
              recents.some(
                (item) => item.providerID === option.value.providerID && item.modelID === option.value.modelID,
              )
            )
              return false
            return true
          }),
          (options) => sortModelOptions(options, props.providerID !== undefined),
        ),
      ),
    )

    const popularProviders = !connected()
      ? pipe(
          providers(),
          map((option) => ({
            ...option,
            category: i18n.t("tui.popular_providers"),
          })),
          take(6),
        )
      : []

    if (needle) {
      return [
        ...sortModelOptions(
          fuzzysort.go(needle, providerOptions, { keys: ["title", "category"] }).map((x) => x.obj),
          false,
        ),
        ...fuzzysort.go(needle, popularProviders, { keys: ["title"] }).map((x) => x.obj),
      ]
    }

    return [...favoriteOptions, ...recentOptions, ...providerOptions, ...popularProviders]
  })

  const provider = createMemo(() =>
    props.providerID ? sync.data.provider.find((item) => item.id === props.providerID) : null,
  )

  const title = createMemo(() => {
    const value = provider()
    if (!value) return i18n.t("dialog.select_model")
    return value.name
  })

  function onSelect(providerID: string, modelID: string) {
    local.model.set({ providerID, modelID }, { recent: true })
    const list = local.model.variant.list()
    const cur = local.model.variant.selected()
    if (cur === "default" || (cur && list.includes(cur))) {
      dialog.clear()
      return
    }
    if (list.length > 0) {
      dialog.replace(() => <DialogVariant />)
      return
    }
    dialog.clear()
  }

  function refresh() {
    if (refreshing()) return
    setRefreshing(true)
    return sdk.client.config.providers2
      .refresh({ workspace: project.workspace.current() }, { throwOnError: true })
      .then((response) => {
        batch(() => {
          sync.set("provider", reconcile(response.data.providers))
          sync.set("provider_default", reconcile(response.data.default))
        })
        toast.show({ message: i18n.t("cli.run.models_refreshed"), variant: "success" })
      })
      .catch(() => {
        toast.show({ message: i18n.t("cli.run.models_refresh_failed"), variant: "error" })
      })
      .finally(() => setRefreshing(false))
  }

  function favoriteMoveDisabled(option: { value: unknown } | undefined, direction: -1 | 1) {
    if (!showExtra() || query().trim()) return true
    const model = option?.value as { providerID: string; modelID: string } | undefined
    if (!model) return true
    return !canReorderFavorite(
      model,
      favoriteModels(),
      direction,
      () => true,
      (left, right) => left.providerID === right.providerID && left.modelID === right.modelID,
    )
  }

  return (
    <DialogSelect<ReturnType<typeof options>[number]["value"]>
      options={options()}
      actions={[
        {
          command: "model.refresh",
          title: i18n.t("cli.run.models_refresh"),
          disabled: refreshing,
          onTrigger() {
            void refresh()
          },
        },
        {
          command: "model.dialog.provider",
          title: connected() ? i18n.t("dialog.connect_provider") : i18n.t("dialog.view_all_providers"),
          onTrigger() {
            dialog.replace(() => <DialogProvider />)
          },
        },
        {
          command: "model.dialog.favorite",
          title: i18n.t("dialog.favorite"),
          hidden: !connected(),
          onTrigger: (option) => {
            local.model.toggleFavorite(option.value as { providerID: string; modelID: string })
          },
        },
        {
          command: "model.dialog.favorite_up",
          title: i18n.t("dialog.favorite_move_up"),
          hidden: !connected(),
          showInFooter: false,
          disabled: (option) => favoriteMoveDisabled(option, -1),
          onTrigger: (option) => {
            local.model.moveFavorite(option.value as { providerID: string; modelID: string }, -1)
          },
        },
        {
          command: "model.dialog.favorite_down",
          title: i18n.t("dialog.favorite_move_down"),
          hidden: !connected(),
          showInFooter: false,
          disabled: (option) => favoriteMoveDisabled(option, 1),
          onTrigger: (option) => {
            local.model.moveFavorite(option.value as { providerID: string; modelID: string }, 1)
          },
        },
      ]}
      onFilter={setQuery}
      flat={true}
      skipFilter={true}
      title={title()}
      current={local.model.current()}
      preserveSelection={true}
    />
  )
}

export function sortModelOptions<T extends { footer?: string; releaseDate: string | number; title: string }>(
  options: T[],
  newestFirst: boolean,
) {
  if (newestFirst) return sortBy(options, [(option) => option.releaseDate, "desc"], (option) => option.title)
  return sortBy(
    options,
    (option) => option.footer !== "Free",
    [(option) => option.releaseDate, "desc"],
    (option) => option.title,
  )
}
