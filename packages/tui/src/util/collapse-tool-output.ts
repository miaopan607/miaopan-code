export function collapseToolOutput(output: string, maxLines: number, maxChars: number) {
  const lines = output.split("\n")
  if (lines.length <= maxLines && Array.from(output).length <= maxChars) {
    return { output, overflow: false }
  }

  const preview = lines.slice(0, maxLines).join("\n")
  if (Array.from(preview).length > maxChars) {
    return {
      output:
        Array.from(preview)
          .slice(0, Math.max(0, maxChars - 1))
          .join("") + "…",
      overflow: true,
    }
  }

  return { output: [...lines.slice(0, maxLines), "…"].join("\n"), overflow: true }
}

export function collapseToolText(text: string, maxWidth: number) {
  const firstLine = text.split("\n", 1)[0] ?? ""
  const marker = " ..."
  const markerWidth = Bun.stringWidth(marker)
  if (text === firstLine && Bun.stringWidth(text) <= maxWidth) return { text, overflow: false }

  const available = Math.max(0, maxWidth - markerWidth)
  const prefix = Array.from(firstLine).reduce(
    (result, character) => {
      const width = Bun.stringWidth(character)
      if (result.width + width > available) return result
      return { text: result.text + character, width: result.width + width }
    },
    { text: "", width: 0 },
  )
  return {
    text: prefix.text + marker,
    overflow: true,
  }
}
