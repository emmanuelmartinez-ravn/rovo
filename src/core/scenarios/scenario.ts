/** One `Label: value` line of a scenario, in path order. */
export type Entry = { label: string; value: string }

/** A saved scenario: a named path through one domain's form. */
export type Scenario = {
  id: string
  name: string
  entries: Entry[]
  createdAt: number
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

export function isScenario(value: unknown): value is Scenario {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'createdAt' in value &&
    typeof value.createdAt === 'number' &&
    'entries' in value &&
    Array.isArray(value.entries) &&
    value.entries.every(
      (entry: unknown) =>
        typeof entry === 'object' &&
        entry !== null &&
        'label' in entry &&
        typeof entry.label === 'string' &&
        'value' in entry &&
        typeof entry.value === 'string',
    )
  )
}
