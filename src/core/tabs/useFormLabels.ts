import { useEffect, useState } from 'react'
import { isFormLabelsMessage, watchFormLabels } from '../content/formLabelWatcher.ts'
import { domainFromUrl } from './domain.ts'

export type FormLabels =
  | { status: 'loading' }
  | { status: 'ready'; labels: string[] }
  /** Not a web page, or one Chrome doesn't let extensions script. */
  | { status: 'unreadable' }

/**
 * The field labels of the form in the active tab of this side panel's
 * window, kept live: a watcher injected into the page reports changes as
 * conditional fields appear. Goes back to `loading` on every tab switch or
 * page load until the new page has been read.
 */
export function useFormLabels(): FormLabels {
  const [state, setState] = useState<FormLabels>({ status: 'loading' })

  useEffect(() => {
    let disposed = false
    let windowId: number | undefined
    let tabId: number | undefined
    // Only the latest read may update state; a slower earlier one is dropped.
    let latestRead = 0

    async function read() {
      const readId = ++latestRead
      const isLatest = () => !disposed && readId === latestRead
      setState({ status: 'loading' })
      try {
        if (windowId === undefined) {
          windowId = (await chrome.windows.getCurrent()).id
        }
        const [tab] = await chrome.tabs.query({ active: true, windowId })
        tabId = tab?.id
        if (tabId === undefined || domainFromUrl(tab?.url ?? tab?.pendingUrl) === null) {
          if (isLatest()) {
            setState({ status: 'unreadable' })
          }
          return
        }
        const [injection] = await chrome.scripting.executeScript({
          target: { tabId },
          func: watchFormLabels,
        })
        if (isLatest()) {
          setState({ status: 'ready', labels: injection?.result ?? [] })
        }
      } catch (error: unknown) {
        // Pages Chrome protects from extensions (e.g. the Web Store) reject here.
        console.error('Failed to read form labels', error)
        if (isLatest()) {
          setState({ status: 'unreadable' })
        }
      }
    }

    function onActivated(info: chrome.tabs.OnActivatedInfo) {
      if (info.windowId === windowId) {
        void read()
      }
    }

    function onUpdated(changedTabId: number, change: chrome.tabs.OnUpdatedInfo) {
      // A finished load is a new document, which needs a new watcher.
      if (changedTabId === tabId && change.status === 'complete') {
        void read()
      }
    }

    function onMessage(message: unknown, sender: chrome.runtime.MessageSender) {
      if (isFormLabelsMessage(message) && sender.tab?.id === tabId && !disposed) {
        setState({ status: 'ready', labels: message.labels })
      }
    }

    chrome.tabs.onActivated.addListener(onActivated)
    chrome.tabs.onUpdated.addListener(onUpdated)
    chrome.runtime.onMessage.addListener(onMessage)
    void read()

    return () => {
      disposed = true
      chrome.tabs.onActivated.removeListener(onActivated)
      chrome.tabs.onUpdated.removeListener(onUpdated)
      chrome.runtime.onMessage.removeListener(onMessage)
    }
  }, [])

  return state
}
