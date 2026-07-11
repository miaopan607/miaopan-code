import { resolveLanguage, t, type Language, type MessageKey } from "@miaopan-code/core/i18n"

let currentLanguage: Language = "zh-CN"

const CATEGORY_KEYS: Record<string, MessageKey> = {
  Dialog: "tui.category_dialog",
  Permission: "tui.category_permission",
  Question: "tui.category_question",
  Prompt: "tui.category_prompt",
  System: "tui.category_system",
  VCS: "tui.category_vcs",
  Plugins: "tui.category_plugins",
  Skills: "tui.category_skills",
  Autocomplete: "tui.category_autocomplete",
  Suggested: "tui.suggested",
}

export function setLanguage(input: unknown) {
  currentLanguage = resolveLanguage(input)
}

export function language() {
  return currentLanguage
}

export function category(value: string) {
  const key = CATEGORY_KEYS[value]
  return key ? t(currentLanguage, key) : value
}

export function titlecase(str: string) {
  return str.replace(/\b\w/g, (c) => c.toUpperCase())
}

export function time(input: number): string {
  const date = new Date(input)
  return date.toLocaleTimeString(currentLanguage, { timeStyle: "short" })
}

export function datetime(input: number): string {
  const date = new Date(input)
  const localTime = time(input)
  const localDate = date.toLocaleDateString(currentLanguage)
  return `${localTime} · ${localDate}`
}

export function todayTimeOrDateTime(input: number): string {
  const date = new Date(input)
  const now = new Date()
  const isToday =
    date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate()

  if (isToday) {
    return time(input)
  } else {
    return datetime(input)
  }
}

export function number(num: number): string {
  if (currentLanguage === "zh-CN") {
    if (num >= 100000000) return t(currentLanguage, "locale.hundred_million", { value: (num / 100000000).toFixed(1) })
    if (num >= 10000) return t(currentLanguage, "locale.ten_thousand", { value: (num / 10000).toFixed(1) })
    return num.toString()
  }
  if (num >= 1000000) {
    return t(currentLanguage, "locale.hundred_million", { value: (num / 1000000).toFixed(1) })
  } else if (num >= 1000) {
    return t(currentLanguage, "locale.ten_thousand", { value: (num / 1000).toFixed(1) })
  }
  return num.toString()
}

export function integer(input: number): string {
  return new Intl.NumberFormat(currentLanguage).format(input)
}

export function currency(input: number, code = "USD"): string {
  return new Intl.NumberFormat(currentLanguage, { style: "currency", currency: code }).format(input)
}

export function duration(input: number) {
  if (currentLanguage === "zh-CN") {
    if (input < 1000) return t(currentLanguage, "locale.millisecond", { value: input })
    if (input < 60000) return t(currentLanguage, "locale.second", { value: (input / 1000).toFixed(1) })
    if (input < 3600000)
      return t(currentLanguage, "locale.minute_second", {
        minutes: Math.floor(input / 60000),
        seconds: Math.floor((input % 60000) / 1000),
      })
    if (input < 86400000)
      return t(currentLanguage, "locale.hour_minute", {
        hours: Math.floor(input / 3600000),
        minutes: Math.floor((input % 3600000) / 60000),
      })
    return t(currentLanguage, "locale.day_hour", {
      days: Math.floor(input / 86400000),
      hours: Math.floor((input % 86400000) / 3600000),
    })
  }
  if (input < 1000) {
    return t(currentLanguage, "locale.millisecond", { value: input })
  }
  if (input < 60000) {
    return t(currentLanguage, "locale.second", { value: (input / 1000).toFixed(1) })
  }
  if (input < 3600000) {
    const minutes = Math.floor(input / 60000)
    const seconds = Math.floor((input % 60000) / 1000)
    return t(currentLanguage, "locale.minute_second", { minutes, seconds })
  }
  if (input < 86400000) {
    const hours = Math.floor(input / 3600000)
    const minutes = Math.floor((input % 3600000) / 60000)
    return t(currentLanguage, "locale.hour_minute", { hours, minutes })
  }
  const days = Math.floor(input / 86400000)
  const hours = Math.floor((input % 86400000) / 3600000)
  return t(currentLanguage, "locale.day_hour", { days, hours })
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str
  return str.slice(0, len - 1) + "…"
}

export function truncateLeft(str: string, len: number): string {
  if (str.length <= len) return str
  return "…" + str.slice(-(len - 1))
}

export function truncateMiddle(str: string, maxLength: number = 35): string {
  if (str.length <= maxLength) return str

  const ellipsis = "…"
  const keepStart = Math.ceil((maxLength - ellipsis.length) / 2)
  const keepEnd = Math.floor((maxLength - ellipsis.length) / 2)

  return str.slice(0, keepStart) + ellipsis + str.slice(-keepEnd)
}

export function pluralize(count: number, singular: string, plural: string): string {
  const template = count === 1 ? singular : plural
  return template.replace("{}", count.toString())
}

export * as Locale from "./locale"
