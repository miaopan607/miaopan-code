/**
 * The small, presentation-agnostic part of continuation resolution.
 *
 * A continuation keeps the original user message as the parent of each
 * assistant attempt. Failed attempts therefore form a chain until a later
 * attempt succeeds. This module only resolves that relationship; it does not
 * mutate or reinterpret the stored messages.
 */

export interface Attempt {
  readonly id: string
  readonly parentID: string
  readonly failed: boolean
}

export interface Input {
  readonly attempts: readonly Attempt[]
  /**
   * The parent currently being continued. When the new assistant attempt has
   * not been persisted yet, the latest failed attempt for this parent is still
   * superseded, but has no target entry yet.
   */
  readonly activeParentID?: string
}

export interface Result {
  /** Assistant attempts that should no longer be presented as the active turn. */
  readonly superseded: string[]
  /** Immediate later attempt for each superseded failed assistant, when known. */
  readonly targetByAssistantID: Record<string, string>
}

/**
 * Resolve failed assistant attempts that have been superseded by a later
 * attempt with the same user parent.
 *
 * `attempts` is expected in chronological order. A failed attempt is paired
 * with the next attempt for the same parent, regardless of that next attempt's
 * success state. This makes repeated failure chains explicit (`a -> b -> c`)
 * while keeping unrelated user turns isolated. A failed attempt without a
 * later sibling is left untouched unless its parent is the active continuation
 * parent; in that case it is included in `superseded` without a target because
 * the replacement assistant row may not have been persisted yet.
 */
export function resolve(input: Input): Result {
  const superseded: string[] = []
  const targetByAssistantID: Record<string, string> = {}
  const latestFailed = new Map<string, string>()

  for (const attempt of input.attempts) {
    const previous = latestFailed.get(attempt.parentID)
    if (previous !== undefined) {
      superseded.push(previous)
      targetByAssistantID[previous] = attempt.id
    }

    if (attempt.failed) {
      latestFailed.set(attempt.parentID, attempt.id)
      continue
    }

    latestFailed.delete(attempt.parentID)
  }

  if (input.activeParentID !== undefined) {
    const active = latestFailed.get(input.activeParentID)
    if (active !== undefined) superseded.push(active)
  }

  return { superseded, targetByAssistantID }
}

export * as SessionContinuation from "./session-continuation"
