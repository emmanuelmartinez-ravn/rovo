import { isScenario, type Entry, type Scenario } from './scenario.ts'

/**
 * Scenarios live in `chrome.storage.local`, one key per domain (the host
 * shown in the header, e.g. `app.example.com` or `localhost:5173`), holding
 * that domain's scenarios oldest first.
 */
export function storageKey(domain: string): string {
  return `scenarios:${domain}`
}

/** Reads a stored value back into scenarios, dropping anything malformed. */
export function toScenarios(stored: unknown): Scenario[] {
  return Array.isArray(stored) ? stored.filter(isScenario) : []
}

export async function loadScenarios(domain: string): Promise<Scenario[]> {
  const key = storageKey(domain)
  const items = await chrome.storage.local.get(key)
  return toScenarios(items[key])
}

export async function addScenario(domain: string, name: string, entries: Entry[]): Promise<Scenario> {
  const scenario: Scenario = { id: crypto.randomUUID(), name, entries, createdAt: Date.now() }
  const existing = await loadScenarios(domain)
  await chrome.storage.local.set({ [storageKey(domain)]: [...existing, scenario] })
  return scenario
}

export async function deleteScenario(domain: string, id: string): Promise<void> {
  const remaining = (await loadScenarios(domain)).filter((scenario) => scenario.id !== id)
  const key = storageKey(domain)
  if (remaining.length === 0) {
    await chrome.storage.local.remove(key)
  } else {
    await chrome.storage.local.set({ [key]: remaining })
  }
}
