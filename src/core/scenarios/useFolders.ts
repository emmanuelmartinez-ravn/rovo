import { useEffect, useState } from 'react'
import { toFolders, type Folder } from './folder.ts'
import { loadFolders, storageKey } from './scenarioStore.ts'

export type FoldersState =
  | { status: 'loading' }
  | { status: 'ready'; folders: Folder[] }
  | { status: 'error' }

type Loaded = { domain: string; state: Exclude<FoldersState, { status: 'loading' }> }

/**
 * The saved folders for `domain`, with their scenarios, kept in sync with
 * storage, so a save, move or delete from any panel (another window
 * included) shows up everywhere.
 */
export function useFolders(domain: string): FoldersState {
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    let disposed = false
    const key = storageKey(domain)
    const settle = (state: Loaded['state']) => {
      if (!disposed) {
        setLoaded({ domain, state })
      }
    }

    loadFolders(domain).then(
      (folders) => settle({ status: 'ready', folders }),
      (error: unknown) => {
        console.error('Failed to load folders', error)
        settle({ status: 'error' })
      },
    )

    function onChanged(changes: Record<string, chrome.storage.StorageChange>, area: chrome.storage.AreaName) {
      const change = changes[key]
      if (area === 'local' && change !== undefined) {
        settle({ status: 'ready', folders: toFolders(change.newValue) })
      }
    }
    chrome.storage.onChanged.addListener(onChanged)

    return () => {
      disposed = true
      chrome.storage.onChanged.removeListener(onChanged)
    }
  }, [domain])

  // Until this domain's read lands, an earlier domain's result is stale.
  return loaded?.domain === domain ? loaded.state : { status: 'loading' }
}
