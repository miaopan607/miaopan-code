const MetadataKey = "$miaopanCode"

type Metadata = {
  readonly mode?: "ultra"
}

export function ultra(options: Record<string, any>) {
  return { ...options, [MetadataKey]: { mode: "ultra" } }
}

export function resolve(input: Record<string, any> | undefined) {
  if (!input) return { mode: undefined, options: {} }
  const metadata = input[MetadataKey] as Metadata | undefined
  const options = { ...input }
  delete options[MetadataKey]
  return {
    mode: metadata?.mode === "ultra" ? metadata.mode : undefined,
    options,
  }
}

export * as ProviderVariant from "./variant"
