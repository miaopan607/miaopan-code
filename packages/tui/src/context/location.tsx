import type { LocationRef } from "@miaopan-code/sdk/v2"
import { createContext, useContext, type Accessor, type ParentProps } from "solid-js"

const context = createContext<Accessor<LocationRef | undefined>>()

export function LocationProvider(props: ParentProps<{ location?: LocationRef }>) {
  return <context.Provider value={() => props.location}>{props.children}</context.Provider>
}

export function useLocation() {
  const value = useContext(context)
  if (!value) throw new Error(t(Locale.language(), "tui.error.location_provider_missing"))
  return value
}
import { t } from "@miaopan-code/core/i18n"
import { Locale } from "../util/locale"
