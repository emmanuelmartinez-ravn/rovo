import { isStoredScenario, type EdgeCase, type Entry, type Scenario } from './scenario.ts'

/**
 * Scenarios live in `chrome.storage.local`, one key per domain (the host
 * shown in the header, e.g. `app.example.com` or `localhost:5173`), holding
 * that domain's scenarios oldest first, each with its edge cases.
 */
export function storageKey(domain: string): string {
  return `scenarios:${domain}`
}

/** Reads a stored value back into scenarios, dropping anything malformed. */
export function toScenarios(stored: unknown): Scenario[] {
  return Array.isArray(stored)
    ? stored.filter(isStoredScenario).map((scenario) => ({ ...scenario, edgeCases: scenario.edgeCases ?? [] }))
    : []
}

export async function loadScenarios(domain: string): Promise<Scenario[]> {
  const key = storageKey(domain)
  const items = await chrome.storage.local.get(key)
  return toScenarios(items[key])
}

export async function addScenario(domain: string, name: string, entries: Entry[]): Promise<Scenario> {
  const scenario: Scenario = { id: crypto.randomUUID(), name, entries, edgeCases: [], createdAt: Date.now() }
  const existing = await loadScenarios(domain)
  await chrome.storage.local.set({ [storageKey(domain)]: [...existing, scenario] })
  return scenario
}

/** The scenario being saved no longer exists, e.g. it was deleted in another window. */
export class ScenarioNotFoundError extends Error {
  constructor(domain: string, id: string) {
    super(`No scenario ${id} on ${domain}`)
    this.name = 'ScenarioNotFoundError'
  }
}

/** The edge case being saved no longer exists, e.g. it was deleted in another window. */
export class EdgeCaseNotFoundError extends Error {
  constructor(scenarioId: string, id: string) {
    super(`No edge case ${id} in scenario ${scenarioId}`)
    this.name = 'EdgeCaseNotFoundError'
  }
}

/**
 * Replaces one scenario with `change(scenario)`, keeping its place in the list.
 * Rejects with `ScenarioNotFoundError` when it's gone.
 */
async function modifyScenario(domain: string, id: string, change: (scenario: Scenario) => Scenario): Promise<Scenario> {
  const scenarios = await loadScenarios(domain)
  const existing = scenarios.find((scenario) => scenario.id === id)
  if (!existing) {
    throw new ScenarioNotFoundError(domain, id)
  }
  const updated = change(existing)
  await chrome.storage.local.set({
    [storageKey(domain)]: scenarios.map((scenario) => (scenario.id === id ? updated : scenario)),
  })
  return updated
}

/** Replaces a scenario's name and entries, keeping its id, creation time, edge cases and place. */
export function updateScenario(domain: string, id: string, name: string, entries: Entry[]): Promise<Scenario> {
  return modifyScenario(domain, id, (scenario) => ({ ...scenario, name, entries }))
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

export type EdgeCaseFields = Pick<EdgeCase, 'name' | 'label' | 'value'>

export function addEdgeCase(domain: string, scenarioId: string, fields: EdgeCaseFields): Promise<Scenario> {
  const edgeCase: EdgeCase = { id: crypto.randomUUID(), ...fields, createdAt: Date.now() }
  return modifyScenario(domain, scenarioId, (scenario) => ({ ...scenario, edgeCases: [...scenario.edgeCases, edgeCase] }))
}

/** Replaces an edge case's fields, keeping its id, creation time and place. */
export function updateEdgeCase(domain: string, scenarioId: string, id: string, fields: EdgeCaseFields): Promise<Scenario> {
  return modifyScenario(domain, scenarioId, (scenario) => {
    if (!scenario.edgeCases.some((edgeCase) => edgeCase.id === id)) {
      throw new EdgeCaseNotFoundError(scenarioId, id)
    }
    return {
      ...scenario,
      edgeCases: scenario.edgeCases.map((edgeCase) => (edgeCase.id === id ? { ...edgeCase, ...fields } : edgeCase)),
    }
  })
}

export function deleteEdgeCase(domain: string, scenarioId: string, id: string): Promise<Scenario> {
  return modifyScenario(domain, scenarioId, (scenario) => ({
    ...scenario,
    edgeCases: scenario.edgeCases.filter((edgeCase) => edgeCase.id !== id),
  }))
}
