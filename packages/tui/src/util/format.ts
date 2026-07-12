import { t } from "@miaopan-code/core/i18n"
import { Locale } from "./locale"

export function formatDuration(secs: number) {
  if (secs <= 0) return ""
  if (secs < 60) return t(Locale.language(), "locale.second", { value: secs })
  if (secs < 3600) {
    const mins = Math.floor(secs / 60)
    const remaining = secs % 60
    return remaining > 0
      ? t(Locale.language(), "locale.minute_second", { minutes: mins, seconds: remaining })
      : t(Locale.language(), "locale.minute", { value: mins })
  }
  if (secs < 86400) {
    const hours = Math.floor(secs / 3600)
    const remaining = Math.floor((secs % 3600) / 60)
    return remaining > 0
      ? t(Locale.language(), "locale.hour_minute", { hours, minutes: remaining })
      : t(Locale.language(), "locale.hour", { value: hours })
  }
  if (secs < 604800) {
    const days = Math.floor(secs / 86400)
    return days === 1
      ? t(Locale.language(), "locale.approx_day")
      : t(Locale.language(), "locale.approx_days", { value: days })
  }
  const weeks = Math.floor(secs / 604800)
  return weeks === 1
    ? t(Locale.language(), "locale.approx_week")
    : t(Locale.language(), "locale.approx_weeks", { value: weeks })
}

export function formatElapsedCompact(secs: number) {
  const seconds = Math.max(0, Math.floor(secs))
  if (seconds < 60) return `${seconds}s`

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (seconds < 3600) return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes.toString().padStart(2, "0")}m ${remainingSeconds.toString().padStart(2, "0")}s`
}
