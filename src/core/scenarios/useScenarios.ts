import { useEffect, useState } from 'react'
import type { Scenario } from './scenario.ts'
import { loadScenarios, storageKey, toScenarios } from './scenarioStore.ts'

export type ScenariosState =
  | { status: 'loading' }
  | { status: 'ready'; scenarios: Scenario[] }
  | { status: 'error' }

type Loaded = { domain: string; state: Exclude<ScenariosState, { status: 'loading' }> }

/**
 * The saved scenarios for `domain`, kept in sync with storage, so a save or
 * delete from any panel (another window included) shows up everywhere.
 */
export function useScenarios(domain: string): ScenariosState {
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    let disposed = false
    const key = storageKey(domain)
    const settle = (state: Loaded['state']) => {
      if (!disposed) {
        setLoaded({ domain, state })
      }
    }

    loadScenarios(domain).then(
      (scenarios) => settle({ status: 'ready', scenarios }),
      (error: unknown) => {
        console.error('Failed to load scenarios', error)
        settle({ status: 'error' })
      },
    )

    function onChanged(changes: Record<string, chrome.storage.StorageChange>, area: chrome.storage.AreaName) {
      const change = changes[key]
      if (area === 'local' && change !== undefined) {
        settle({ status: 'ready', scenarios: toScenarios(change.newValue) })
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
