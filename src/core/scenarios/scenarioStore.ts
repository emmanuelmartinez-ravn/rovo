import { folderNameError, MIGRATED_FOLDER_NAME, toFolders, toScenarios, type Folder } from './folder.ts'
import type { EdgeCase, Entry, Scenario } from './scenario.ts'

/**
 * Folders live in `chrome.storage.local`, one key per domain (the host shown
 * in the header, e.g. `app.example.com` or `localhost:5173`), holding that
 * domain's folders oldest first, each with its scenarios and their edge cases.
 */
export function storageKey(domain: string): string {
  return `folders:${domain}`
}

/** Where scenarios were kept before folders: one flat list per domain. */
function legacyKey(domain: string): string {
  return `scenarios:${domain}`
}

/**
 * The domain's folders. The first read after folders were added moves the
 * domain's old flat list of scenarios into one `Untitled form` folder and
 * removes the old key, so it happens once.
 */
export async function loadFolders(domain: string): Promise<Folder[]> {
  const key = storageKey(domain)
  const legacy = legacyKey(domain)
  const items = await chrome.storage.local.get([key, legacy])
  const folders = toFolders(items[key])
  if (items[legacy] === undefined) {
    return folders
  }
  const scenarios = toScenarios(items[legacy])
  // A domain that already has folders was migrated, e.g. by another window.
  const migrated =
    items[key] === undefined && scenarios.length > 0
      ? [{ id: crypto.randomUUID(), name: MIGRATED_FOLDER_NAME, scenarios, createdAt: Date.now() }]
      : folders
  await saveFolders(domain, migrated)
  await chrome.storage.local.remove(legacy)
  return migrated
}

async function saveFolders(domain: string, folders: Folder[]): Promise<void> {
  const key = storageKey(domain)
  if (folders.length === 0) {
    await chrome.storage.local.remove(key)
  } else {
    await chrome.storage.local.set({ [key]: folders })
  }
}

/** The folder being saved into no longer exists, e.g. it was deleted in another window. */
export class FolderNotFoundError extends Error {
  constructor(domain: string, id: string) {
    super(`No folder ${id} on ${domain}`)
    this.name = 'FolderNotFoundError'
  }
}

/** Another folder on the domain has this name, e.g. one created in another window. */
export class FolderNameTakenError extends Error {
  readonly existing: string

  constructor(existing: string) {
    super(`A folder named ${existing} already exists`)
    this.name = 'FolderNameTakenError'
    this.existing = existing
  }
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

/** Rejects a blank name, or one another folder has, with the matching error. */
function checkName(name: string, folders: readonly Folder[], exceptId?: string): void {
  const error = folderNameError(name, folders, exceptId)
  if (error?.kind === 'taken') {
    throw new FolderNameTakenError(error.existing.name)
  }
  if (error?.kind === 'empty') {
    throw new Error('A folder name must not be blank')
  }
}

export async function addFolder(domain: string, name: string): Promise<Folder> {
  const folders = await loadFolders(domain)
  checkName(name, folders)
  const folder: Folder = { id: crypto.randomUUID(), name: name.trim(), scenarios: [], createdAt: Date.now() }
  await saveFolders(domain, [...folders, folder])
  return folder
}

/**
 * Replaces one folder with `change(folder)`, keeping its place in the list.
 * Rejects with `FolderNotFoundError` when it's gone.
 */
async function modifyFolder(domain: string, id: string, change: (folder: Folder, folders: Folder[]) => Folder): Promise<Folder> {
  const folders = await loadFolders(domain)
  const existing = folders.find((folder) => folder.id === id)
  if (!existing) {
    throw new FolderNotFoundError(domain, id)
  }
  const updated = change(existing, folders)
  await saveFolders(
    domain,
    folders.map((folder) => (folder.id === id ? updated : folder)),
  )
  return updated
}

/** Renames a folder, keeping its id, creation time, scenarios and place. */
export function renameFolder(domain: string, id: string, name: string): Promise<Folder> {
  return modifyFolder(domain, id, (folder, folders) => {
    checkName(name, folders, id)
    return { ...folder, name: name.trim() }
  })
}

/** Deletes a folder with its scenarios and their edge cases. */
export async function deleteFolder(domain: string, id: string): Promise<void> {
  const folders = await loadFolders(domain)
  await saveFolders(
    domain,
    folders.filter((folder) => folder.id !== id),
  )
}

export async function addScenario(domain: string, folderId: string, name: string, entries: Entry[]): Promise<Scenario> {
  const scenario: Scenario = { id: crypto.randomUUID(), name, entries, edgeCases: [], createdAt: Date.now() }
  await modifyFolder(domain, folderId, (folder) => ({ ...folder, scenarios: [...folder.scenarios, scenario] }))
  return scenario
}

/**
 * Replaces one scenario with `change(scenario)`, in whichever folder holds it,
 * keeping its place. Rejects with `ScenarioNotFoundError` when it's gone.
 */
async function modifyScenario(domain: string, id: string, change: (scenario: Scenario) => Scenario): Promise<Scenario> {
  const folders = await loadFolders(domain)
  const existing = folders.flatMap((folder) => folder.scenarios).find((scenario) => scenario.id === id)
  if (!existing) {
    throw new ScenarioNotFoundError(domain, id)
  }
  const updated = change(existing)
  await saveFolders(
    domain,
    folders.map((folder) => ({
      ...folder,
      scenarios: folder.scenarios.map((scenario) => (scenario.id === id ? updated : scenario)),
    })),
  )
  return updated
}

/** Replaces a scenario's name and entries, keeping its id, creation time, edge cases and place. */
export function updateScenario(domain: string, id: string, name: string, entries: Entry[]): Promise<Scenario> {
  return modifyScenario(domain, id, (scenario) => ({ ...scenario, name, entries }))
}

export async function deleteScenario(domain: string, id: string): Promise<void> {
  const folders = await loadFolders(domain)
  await saveFolders(
    domain,
    folders.map((folder) => ({ ...folder, scenarios: folder.scenarios.filter((scenario) => scenario.id !== id) })),
  )
}

/**
 * Moves a scenario, unchanged, to the end of another folder on the same
 * domain. Rejects with `ScenarioNotFoundError` or `FolderNotFoundError` when
 * either is gone.
 */
export async function moveScenario(domain: string, id: string, toFolderId: string): Promise<void> {
  const folders = await loadFolders(domain)
  const scenario = folders.flatMap((folder) => folder.scenarios).find((s) => s.id === id)
  if (!scenario) {
    throw new ScenarioNotFoundError(domain, id)
  }
  if (!folders.some((folder) => folder.id === toFolderId)) {
    throw new FolderNotFoundError(domain, toFolderId)
  }
  await saveFolders(
    domain,
    folders.map((folder) => {
      const rest = folder.scenarios.filter((s) => s.id !== id)
      return { ...folder, scenarios: folder.id === toFolderId ? [...rest, scenario] : rest }
    }),
  )
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
