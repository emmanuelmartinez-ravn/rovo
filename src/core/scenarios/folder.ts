import { isStoredScenario, type Scenario, type StoredScenario } from './scenario.ts'

/** A saved folder: one form on a domain, holding the scenarios that fill it, oldest first. */
export type Folder = {
  id: string
  name: string
  scenarios: Scenario[]
  createdAt: number
}

/** The folder scenarios saved before folders existed are moved into. */
export const MIGRATED_FOLDER_NAME = 'Untitled form'

/** Why a folder name can't be saved. */
export type FolderNameError = { kind: 'empty' } | { kind: 'taken'; existing: Folder }

/**
 * Checks a folder name against the domain's other folders: it can't be blank,
 * or match another folder's ignoring case and surrounding whitespace.
 * `exceptId` is the folder being renamed, which may keep its own name.
 */
export function folderNameError(name: string, folders: readonly Folder[], exceptId?: string): FolderNameError | null {
  const key = name.trim().toLowerCase()
  if (key === '') {
    return { kind: 'empty' }
  }
  const existing = folders.find((folder) => folder.id !== exceptId && folder.name.trim().toLowerCase() === key)
  return existing ? { kind: 'taken', existing } : null
}

/** `3 scenarios`, `1 scenario`, `No scenarios`. */
export function scenarioCount(folder: Folder): string {
  const count = folder.scenarios.length
  return count === 0 ? 'No scenarios' : `${count} ${count === 1 ? 'scenario' : 'scenarios'}`
}

/** A folder as stored, before its scenarios are read back. */
type StoredFolder = Omit<Folder, 'scenarios'> & { scenarios: StoredScenario[] }

const isRecord = (value: unknown): value is object => typeof value === 'object' && value !== null

function isStoredFolder(value: unknown): value is StoredFolder {
  return (
    isRecord(value) &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'createdAt' in value &&
    typeof value.createdAt === 'number' &&
    'scenarios' in value &&
    Array.isArray(value.scenarios)
  )
}

/** Reads a stored value back into scenarios, dropping anything malformed. */
export function toScenarios(stored: unknown): Scenario[] {
  return Array.isArray(stored)
    ? stored.filter(isStoredScenario).map((scenario) => ({ ...scenario, edgeCases: scenario.edgeCases ?? [] }))
    : []
}

/** Reads a stored value back into folders, dropping malformed folders and scenarios. */
export function toFolders(stored: unknown): Folder[] {
  return Array.isArray(stored)
    ? stored.filter(isStoredFolder).map((folder) => ({ ...folder, scenarios: toScenarios(folder.scenarios) }))
    : []
}
