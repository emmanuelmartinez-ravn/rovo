import { formatEntries, targetEntry, type EdgeCase, type Entry, type Scenario } from '../scenarios/scenario.ts'

/** How long a run keeps retrying one entry before it marks it as failed. */
export const ENTRY_TIMEOUT_MS = 10_000

/** One entry as a run fills it. `scenarioValue` is set on the entry an edge case replaced. */
export type RunEntry = Entry & { scenarioValue?: string }

/**
 * The entries a run fills, in path order: the scenario's own, or, with an
 * edge case, the same entries with the targeted one's value replaced.
 */
export function runEntries(scenario: Scenario, edgeCase?: EdgeCase): RunEntry[] {
  const target = edgeCase && targetEntry(scenario, edgeCase)
  return scenario.entries.map((entry) =>
    entry === target && edgeCase ? { ...entry, value: edgeCase.value, scenarioValue: entry.value } : entry,
  )
}

/**
 * The values a run used, as `Label: value` lines in path order: every entry,
 * or, when it failed at `failedIndex`, the entries up to and including the
 * one it tried and couldn't fill. An edge case's entry carries its own value.
 */
export function usedValuesText(entries: readonly RunEntry[], failedIndex?: number): string {
  return formatEntries(failedIndex === undefined ? entries : entries.slice(0, failedIndex + 1))
}

/** Why an entry couldn't be filled. */
export type RunFailure =
  /** No field with this label appeared before the timeout. */
  | { kind: 'notFound' }
  /** The field exists, but none of its options matches the value. */
  | { kind: 'noOption'; options: string[] }
  /** The field stayed disabled or read-only until the timeout. */
  | { kind: 'disabled' }
  /** A single checkbox's value isn't yes/no-like. */
  | { kind: 'checkboxValue' }

/** Progress reported by the page while it runs, one message per change. */
export type RunEvent =
  | { kind: 'active'; index: number }
  | { kind: 'filled'; index: number }
  | { kind: 'failed'; index: number; failure: RunFailure }
  | { kind: 'stopped'; index: number }
  | { kind: 'finished' }

export const RUN_EVENT_MESSAGE = 'rovo:run-event'
export const RUN_STOP_MESSAGE = 'rovo:run-stop'

export type RunEventMessage = { type: typeof RUN_EVENT_MESSAGE; runId: string; event: RunEvent }
export type RunStopMessage = { type: typeof RUN_STOP_MESSAGE; runId: string }

const isRecord = (value: unknown): value is object => typeof value === 'object' && value !== null

function isRunFailure(value: unknown): value is RunFailure {
  if (!isRecord(value) || !('kind' in value)) {
    return false
  }
  switch (value.kind) {
    case 'notFound':
    case 'disabled':
    case 'checkboxValue':
      return true
    case 'noOption':
      return 'options' in value && Array.isArray(value.options) && value.options.every((o: unknown) => typeof o === 'string')
    default:
      return false
  }
}

function isRunEvent(value: unknown): value is RunEvent {
  if (!isRecord(value) || !('kind' in value)) {
    return false
  }
  const hasIndex = 'index' in value && typeof value.index === 'number'
  switch (value.kind) {
    case 'active':
    case 'filled':
    case 'stopped':
      return hasIndex
    case 'failed':
      return hasIndex && 'failure' in value && isRunFailure(value.failure)
    case 'finished':
      return true
    default:
      return false
  }
}

export function isRunEventMessage(value: unknown): value is RunEventMessage {
  return (
    isRecord(value) &&
    'type' in value &&
    value.type === RUN_EVENT_MESSAGE &&
    'runId' in value &&
    typeof value.runId === 'string' &&
    'event' in value &&
    isRunEvent(value.event)
  )
}
