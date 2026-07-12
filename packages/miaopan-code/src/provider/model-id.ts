const GPT_VERSION_RE = /(?:^|[/.])gpt-(\d+)[.-](\d+)(?:[.-]|$)/i

export function gptVersion(id: string) {
  const match = GPT_VERSION_RE.exec(id)
  if (!match) return
  return { major: Number(match[1]), minor: Number(match[2]) }
}

export function gpt5MinorVersion(id: string) {
  const version = gptVersion(id)
  return version?.major === 5 ? version.minor : undefined
}

export function isGpt56Plus(input: { id?: string; api?: { id?: string } }) {
  return [input.api?.id, input.id].some((id) => id !== undefined && (gpt5MinorVersion(id) ?? 0) >= 6)
}
