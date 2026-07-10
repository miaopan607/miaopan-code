import { getComponentCatalogue } from "@opentui/solid/components"
import { registerSpinner } from "opentui-spinner/solid"

export function registerMiaopanCodeSpinner() {
  if (!getComponentCatalogue().spinner) registerSpinner()
}
