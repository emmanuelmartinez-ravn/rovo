/** One `Label: value` line of a scenario, in path order. */
export type Entry = { label: string; value: string }

/**
 * A saved edge case: the scenario run with one entry's value replaced. It
 * targets its entry by label, so it outlives edits that reorder entries; when
 * the scenario no longer has that label it's orphaned (see `isOrphaned`).
 */
export type EdgeCase = {
  id: string
  name: string
  label: string
  value: string
  createdAt: number
}

/** A saved scenario: a named path through one domain's form. */
export type Scenario = {
  id: string
  name: string
  entries: Entry[]
  edgeCases: EdgeCase[]
  createdAt: number
}

/** The entry an edge case replaces, or undefined when it's gone from the scenario. */
export function targetEntry(scenario: Scenario, edgeCase: Pick<EdgeCase, 'label'>): Entry | undefined {
  return scenario.entries.find((entry) => entry.label === edgeCase.label)
}

export function isOrphaned(scenario: Scenario, edgeCase: EdgeCase): boolean {
  return targetEntry(scenario, edgeCase) === undefined
}

/** Why a scenario's entries text can't be saved. `line` is 1-based. */
export type EntriesError =
  | { kind: 'noEntries' }
  | { kind: 'missingColon'; line: number; suggestion: string | null }
  | { kind: 'missingLabel'; line: number }

export type ParsedEntries = { entries: Entry[]; error: EntriesError | null }

/**
 * Parses the editor text: one `Label: value` per line, split at the first
 * colon, blank lines ignored. Stops at the first invalid line. For a line
 * missing its colon, `knownLabels` (the page's field labels) suggest the fix
 * when the line starts with one of them: `Tax ID 12-3456789` →
 * `Tax ID: 12-3456789`.
 */
export function parseEntries(text: string, knownLabels: readonly string[] = []): ParsedEntries {
  const entries: Entry[] = []
  const lines = text.split('\n')
  for (const [index, raw] of lines.entries()) {
    const line = raw.trim()
    if (line === '') {
      continue
    }
    const colon = line.indexOf(':')
    if (colon === -1) {
      return { entries, error: { kind: 'missingColon', line: index + 1, suggestion: suggestColon(line, knownLabels) } }
    }
    const label = line.slice(0, colon).trim()
    if (label === '') {
      return { entries, error: { kind: 'missingLabel', line: index + 1 } }
    }
    entries.push({ label, value: line.slice(colon + 1).trim() })
  }
  return { entries, error: entries.length === 0 ? { kind: 'noEntries' } : null }
}

function suggestColon(line: string, knownLabels: readonly string[]): string | null {
  const lower = line.toLowerCase()
  // Longest first, so "Business type" wins over "Business".
  const label = [...knownLabels]
    .sort((a, b) => b.length - a.length)
    .find((known) => lower.startsWith(`${known.toLowerCase()} `))
  return label === undefined ? null : `${label}: ${line.slice(label.length).trim()}`
}

/** Serializes entries back to editor text. */
export function formatEntries(entries: readonly Entry[]): string {
  return entries.map(({ label, value }) => `${label}: ${value}`).join('\n')
}

/** A scenario as stored: scenarios saved before edge cases existed have none. */
export type StoredScenario = Omit<Scenario, 'edgeCases'> & { edgeCases?: EdgeCase[] }

const isRecord = (value: unknown): value is object => typeof value === 'object' && value !== null

function isEntry(value: unknown): value is Entry {
  return (
    isRecord(value) &&
    'label' in value &&
    typeof value.label === 'string' &&
    'value' in value &&
    typeof value.value === 'string'
  )
}

function isEdgeCase(value: unknown): value is EdgeCase {
  return (
    isEntry(value) &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'createdAt' in value &&
    typeof value.createdAt === 'number'
  )
}

export function isStoredScenario(value: unknown): value is StoredScenario {
  return (
    isRecord(value) &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'createdAt' in value &&
    typeof value.createdAt === 'number' &&
    'entries' in value &&
    Array.isArray(value.entries) &&
    value.entries.every(isEntry) &&
    (!('edgeCases' in value) ||
      value.edgeCases === undefined ||
      (Array.isArray(value.edgeCases) && value.edgeCases.every(isEdgeCase)))
  )
}
