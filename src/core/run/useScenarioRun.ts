import { useEffect, useState } from 'react'
import { runScenarioInPage } from '../content/scenarioRunner.ts'
import type { EdgeCase, Scenario } from '../scenarios/scenario.ts'
import {
  ENTRY_TIMEOUT_MS,
  isRunEventMessage,
  RUN_STOP_MESSAGE,
  runEntries,
  type RunEntry,
  type RunEvent,
  type RunFailure,
  type RunStopMessage,
} from './run.ts'

export type StepStatus = 'pending' | 'active' | 'filled' | 'failed'

/** A run that was started in a tab, at any point of its life. */
export type Run = {
  id: string
  tabId: number
  scenario: Scenario
  edgeCase?: EdgeCase
  entries: RunEntry[]
  steps: StepStatus[]
  status:
    | 'running'
    /** Every entry filled. */
    | 'finished'
    /** An entry couldn't be filled; `failure` says which and why. */
    | 'failed'
    /** The tester stopped it before `stoppedAt`. */
    | 'stopped'
    /** The page navigated, reloaded or closed mid-run. */
    | 'interrupted'
  stopRequested: boolean
  failure?: { index: number; failure: RunFailure }
  stoppedAt?: number
}

export type RunState =
  | { status: 'idle' }
  | { status: 'starting' }
  /** The run couldn't start: another run is going in that page, or Rovo can't script it. */
  | { status: 'unavailable'; reason: 'busy' | 'unreadable' }
  | Run

function apply(run: Run, event: RunEvent): Run {
  switch (event.kind) {
    case 'active':
      return { ...run, steps: run.steps.map((step, i) => (i === event.index ? 'active' : step)) }
    case 'filled':
      return { ...run, steps: run.steps.map((step, i) => (i === event.index ? 'filled' : step)) }
    case 'failed':
      return {
        ...run,
        status: 'failed',
        steps: run.steps.map((step, i) => (i === event.index ? 'failed' : step)),
        failure: { index: event.index, failure: event.failure },
      }
    case 'stopped':
      return {
        ...run,
        status: 'stopped',
        stoppedAt: event.index,
        steps: run.steps.map((step) => (step === 'active' ? 'pending' : step)),
      }
    case 'finished':
      return { ...run, status: 'finished' }
  }
}

/**
 * Runs scenarios (optionally with an edge case) in the active tab of this
 * panel's window, and tracks their progress. The run itself lives in the
 * page, so it carries on if the panel closes; this state is the panel's view
 * of it.
 */
export function useScenarioRun(): {
  state: RunState
  start: (scenario: Scenario, edgeCase?: EdgeCase) => void
  stop: () => void
  reset: () => void
} {
  const [state, setState] = useState<RunState>({ status: 'idle' })
  const runId = 'id' in state ? state.id : null
  const tabId = 'tabId' in state ? state.tabId : null
  const live = state.status === 'running'

  useEffect(() => {
    if (!live || runId === null || tabId === null) {
      return
    }
    const update = (change: (run: Run) => Run) =>
      setState((current) => ('id' in current && current.id === runId && current.status === 'running' ? change(current) : current))

    function onMessage(message: unknown, sender: chrome.runtime.MessageSender) {
      if (isRunEventMessage(message) && message.runId === runId && sender.tab?.id === tabId) {
        update((run) => apply(run, message.event))
      }
    }
    // Nothing is running any more: the step that was in progress goes back to not done.
    const interrupt = () =>
      update((run) => ({
        ...run,
        status: 'interrupted',
        steps: run.steps.map((step) => (step === 'active' ? 'pending' : step)),
      }))
    function onUpdated(changedTabId: number, change: chrome.tabs.OnUpdatedInfo) {
      // A new document is loading: the page running the scenario is gone.
      if (changedTabId === tabId && change.status === 'loading') {
        interrupt()
      }
    }
    function onRemoved(removedTabId: number) {
      if (removedTabId === tabId) {
        interrupt()
      }
    }

    chrome.runtime.onMessage.addListener(onMessage)
    chrome.tabs.onUpdated.addListener(onUpdated)
    chrome.tabs.onRemoved.addListener(onRemoved)
    return () => {
      chrome.runtime.onMessage.removeListener(onMessage)
      chrome.tabs.onUpdated.removeListener(onUpdated)
      chrome.tabs.onRemoved.removeListener(onRemoved)
    }
  }, [live, runId, tabId])

  function start(scenario: Scenario, edgeCase?: EdgeCase) {
    setState({ status: 'starting' })
    const entries = runEntries(scenario, edgeCase)
    const id = crypto.randomUUID()
    void (async () => {
      try {
        const panelWindow = await chrome.windows.getCurrent()
        const [tab] = await chrome.tabs.query({ active: true, windowId: panelWindow.id })
        if (tab?.id === undefined) {
          throw new Error('No active tab')
        }
        const tabIdToRun = tab.id
        // Subscribe before the page can report anything: state goes to running first.
        setState({
          id,
          tabId: tabIdToRun,
          scenario,
          edgeCase,
          entries,
          steps: entries.map(() => 'pending'),
          status: 'running',
          stopRequested: false,
        })
        const [injection] = await chrome.scripting.executeScript({
          target: { tabId: tabIdToRun },
          func: runScenarioInPage,
          args: [id, entries.map(({ label, value }) => ({ label, value })), ENTRY_TIMEOUT_MS],
        })
        if (injection?.result === 'busy') {
          setState({ status: 'unavailable', reason: 'busy' })
        }
      } catch (error: unknown) {
        console.error('Failed to start the run', error)
        setState({ status: 'unavailable', reason: 'unreadable' })
      }
    })()
  }

  function stop() {
    if (state.status !== 'running' || state.stopRequested) {
      return
    }
    const message: RunStopMessage = { type: RUN_STOP_MESSAGE, runId: state.id }
    setState({ ...state, stopRequested: true })
    chrome.tabs.sendMessage(state.tabId, message).catch((error: unknown) => {
      // The page is gone; the navigation listener reports it.
      console.error('Failed to stop the run', error)
    })
  }

  return { state, start, stop, reset: () => setState({ status: 'idle' }) }
}
