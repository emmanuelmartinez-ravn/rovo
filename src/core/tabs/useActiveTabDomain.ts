import { useEffect, useState } from 'react'
import { domainFromUrl } from './domain.ts'

export type ActiveTabDomain =
  | { status: 'loading' }
  | { status: 'ready'; domain: string | null }
  | { status: 'error' }

/**
 * Tracks the domain of the active tab in the window this side panel belongs
 * to. Goes back to `loading` on every tab switch or cross-domain navigation
 * until the new tab has been read.
 */
export function useActiveTabDomain(): ActiveTabDomain {
  const [state, setState] = useState<ActiveTabDomain>({ status: 'loading' })

  useEffect(() => {
    let disposed = false
    let windowId: number | undefined
    let currentDomain: string | null | undefined
    // Only the latest read may update state; a slower earlier one is dropped.
    let latestRead = 0

    async function read() {
      const readId = ++latestRead
      setState({ status: 'loading' })
      try {
        if (windowId === undefined) {
          windowId = (await chrome.windows.getCurrent()).id
        }
        const [tab] = await chrome.tabs.query({ active: true, windowId })
        if (disposed || readId !== latestRead) {
          return
        }
        // A mid-navigation tab may only have a pendingUrl. With neither, Chrome
        // is withholding the URL (the `tabs` permission isn't granted), which
        // must not be mistaken for a non-web page.
        const url = tab?.url ?? tab?.pendingUrl
        if (url === undefined) {
          throw new Error('Active tab has no readable URL')
        }
        currentDomain = domainFromUrl(url)
        setState({ status: 'ready', domain: currentDomain })
      } catch (error: unknown) {
        console.error('Failed to read the active tab', error)
        if (!disposed && readId === latestRead) {
          currentDomain = undefined
          setState({ status: 'error' })
        }
      }
    }

    function onActivated(info: chrome.tabs.OnActivatedInfo) {
      if (info.windowId === windowId) {
        void read()
      }
    }

    function onUpdated(
      _tabId: number,
      change: chrome.tabs.OnUpdatedInfo,
      tab: chrome.tabs.Tab,
    ) {
      if (
        change.url !== undefined &&
        tab.active &&
        tab.windowId === windowId &&
        domainFromUrl(change.url) !== currentDomain
      ) {
        void read()
      }
    }

    chrome.tabs.onActivated.addListener(onActivated)
    chrome.tabs.onUpdated.addListener(onUpdated)
    void read()

    return () => {
      disposed = true
      chrome.tabs.onActivated.removeListener(onActivated)
      chrome.tabs.onUpdated.removeListener(onUpdated)
    }
  }, [])

  return state
}
