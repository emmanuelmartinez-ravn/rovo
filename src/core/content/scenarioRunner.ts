import type { RunEvent, RunFailure } from '../run/run.ts'

/**
 * Runs a scenario inside the tested page. Injected with
 * `chrome.scripting.executeScript`, which serializes it by source: it must not
 * reference anything outside its own body (type imports are erased, and the
 * message types are repeated as literals for that reason).
 *
 * Fills `entries` one at a time, in order. Each entry's field is looked up by
 * its label and retried — on every page change, and at least every 150ms —
 * until it can be filled or `timeoutMs` passes, so conditional fields have
 * time to appear. Progress goes to the extension as `rovo:run-event`
 * messages; a `rovo:run-stop` message for this run stops it before the next
 * field. Returns at once: `busy` when another run is already going in the page.
 *
 * Matching: labels compare case-insensitively, with whitespace collapsed and a
 * trailing required marker (`*`, `(required)`) ignored. A field already filled
 * in this run is skipped, so a repeated label takes the next match.
 *
 * Filling: text fields and textareas get their value through the native
 * setter plus input/change events (so framework-controlled inputs see it);
 * selects pick the option whose text or value matches; radio and checkbox
 * groups (a `<fieldset>`'s `<legend>`, or an ARIA group's name) click the
 * option whose label matches; a single checkbox takes yes/true/on or
 * no/false/off.
 */
export function runScenarioInPage(
  runId: string,
  entries: { label: string; value: string }[],
  timeoutMs: number,
): 'started' | 'busy' {
  type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
  type Target = { kind: 'field'; field: Field } | { kind: 'group'; group: Element; options: HTMLInputElement[] }
  type Outcome = { failure: RunFailure; retry: boolean } | null

  const state = globalThis as typeof globalThis & { __rovoRun?: { runId: string } }
  if (state.__rovoRun) {
    return 'busy'
  }
  state.__rovoRun = { runId }
  let stopRequested = false

  const send = (event: RunEvent) => {
    try {
      // No listener (panel closed) rejects; that's fine, the run goes on.
      chrome.runtime.sendMessage({ type: 'rovo:run-event', runId, event }).catch(() => {})
    } catch {
      // The extension was reloaded: nobody is listening any more.
    }
  }
  const onMessage = (message: unknown) => {
    if (
      typeof message === 'object' &&
      message !== null &&
      'type' in message &&
      message.type === 'rovo:run-stop' &&
      'runId' in message &&
      message.runId === runId
    ) {
      stopRequested = true
    }
  }
  chrome.runtime.onMessage.addListener(onMessage)

  const normalize = (text: string): string =>
    text
      .replace(/[\s   ]+/g, ' ')
      .trim()
      .replace(/\s*(?:[*∗＊✱]+|\(required\))$/i, '')
      .trim()
      .toLowerCase()
  const textOf = (el: Element): string => {
    const copy = el.cloneNode(true)
    if (copy instanceof Element) {
      copy.querySelectorAll('input, select, textarea, option').forEach((n) => n.remove())
    }
    return copy.textContent ?? ''
  }
  const isShown = (el: Element): boolean =>
    el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'
  const nameFrom = (el: Element): string => {
    const labelledBy = el.getAttribute('aria-labelledby')
    if (labelledBy) {
      return labelledBy
        .split(/\s+/)
        .map((id) => document.getElementById(id))
        .filter((ref): ref is HTMLElement => ref !== null)
        .map(textOf)
        .join(' ')
    }
    return el.getAttribute('aria-label') ?? ''
  }
  const labelOf = (field: Field): string => {
    const label = field.labels?.[0]
    return label ? textOf(label) : nameFrom(field)
  }
  /** The labelled group a radio or checkbox belongs to, if any. */
  const groupOf = (input: HTMLInputElement): { group: Element; label: string } | null => {
    const fieldset = input.closest('fieldset')
    const legend = fieldset?.querySelector(':scope > legend')
    if (fieldset && legend) {
      return { group: fieldset, label: textOf(legend) }
    }
    const aria = input.closest('[role="radiogroup"], [role="group"]')
    return aria ? { group: aria, label: nameFrom(aria) } : null
  }
  const isChoice = (field: Field): field is HTMLInputElement =>
    field instanceof HTMLInputElement && (field.type === 'radio' || field.type === 'checkbox')

  const find = (label: string, used: ReadonlySet<Element>): Target | null => {
    const want = normalize(label)
    const skipped = new Set(['hidden', 'submit', 'button', 'reset', 'image', 'file'])
    for (const el of document.querySelectorAll('input, select, textarea')) {
      if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement)) {
        continue
      }
      if ((el instanceof HTMLInputElement && skipped.has(el.type)) || !isShown(el.labels?.[0] ?? el)) {
        continue
      }
      if (isChoice(el)) {
        const group = groupOf(el)
        if (group && normalize(group.label) === want) {
          if (used.has(group.group)) {
            continue
          }
          const options = [...group.group.querySelectorAll('input')].filter(
            (o) => (o.type === 'radio' || o.type === 'checkbox') && isShown(o.labels?.[0] ?? o),
          )
          return { kind: 'group', group: group.group, options }
        }
        if (el.type === 'checkbox' && !group && normalize(labelOf(el)) === want && !used.has(el)) {
          return { kind: 'field', field: el }
        }
        continue
      }
      if (normalize(labelOf(el)) === want && !used.has(el)) {
        return { kind: 'field', field: el }
      }
    }
    return null
  }

  const setNativeValue = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string) => {
    // The prototype's setter, not the instance's: frameworks like React wrap the
    // instance property and would otherwise miss the change.
    const proto =
      field instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : field instanceof HTMLTextAreaElement
          ? HTMLTextAreaElement.prototype
          : HTMLInputElement.prototype
    Reflect.set(proto, 'value', value, field)
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new Event('change', { bubbles: true }))
  }

  const fill = (target: Target, value: string): Outcome => {
    const want = normalize(value)
    if (target.kind === 'group') {
      const optionLabel = (o: HTMLInputElement) => (o.labels?.[0] ? textOf(o.labels[0]) : nameFrom(o) || o.value)
      const match = target.options.find((o) => normalize(optionLabel(o)) === want)
      if (!match) {
        return { failure: { kind: 'noOption', options: target.options.map((o) => optionLabel(o).trim()) }, retry: true }
      }
      if (match.disabled) {
        return { failure: { kind: 'disabled' }, retry: true }
      }
      if (!match.checked) {
        match.click()
      }
      return null
    }
    const { field } = target
    if (field.disabled || (!(field instanceof HTMLSelectElement) && field.readOnly)) {
      return { failure: { kind: 'disabled' }, retry: true }
    }
    if (field instanceof HTMLSelectElement) {
      const options = [...field.options]
      const match = options.find((o) => normalize(o.text) === want || o.value === value)
      if (!match) {
        return { failure: { kind: 'noOption', options: options.map((o) => o.text.trim()) }, retry: true }
      }
      setNativeValue(field, match.value)
      return null
    }
    if (field instanceof HTMLInputElement && field.type === 'checkbox') {
      const checked = /^(yes|true|on|checked|1)$/i.test(value.trim())
      if (!checked && !/^(no|false|off|unchecked|0)$/i.test(value.trim())) {
        return { failure: { kind: 'checkboxValue' }, retry: false }
      }
      if (field.checked !== checked) {
        field.click()
      }
      return null
    }
    field.focus()
    setNativeValue(field, value)
    field.blur()
    return null
  }

  /** Resolves on the next page change, or after 150ms, whichever is first. */
  const nextChance = () =>
    new Promise<void>((resolve) => {
      const done = () => {
        observer.disconnect()
        clearTimeout(timer)
        resolve()
      }
      const observer = new MutationObserver(done)
      observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true })
      const timer = setTimeout(done, 150)
    })

  const run = async () => {
    const used = new Set<Element>()
    for (const [index, entry] of entries.entries()) {
      if (stopRequested) {
        send({ kind: 'stopped', index })
        return
      }
      send({ kind: 'active', index })
      const deadline = Date.now() + timeoutMs
      let failure: RunFailure = { kind: 'notFound' }
      for (;;) {
        if (stopRequested) {
          send({ kind: 'stopped', index })
          return
        }
        const target = find(entry.label, used)
        if (target) {
          const outcome = fill(target, entry.value)
          if (outcome === null) {
            used.add(target.kind === 'group' ? target.group : target.field)
            break
          }
          failure = outcome.failure
          if (!outcome.retry) {
            send({ kind: 'failed', index, failure })
            return
          }
        }
        if (Date.now() >= deadline) {
          send({ kind: 'failed', index, failure })
          return
        }
        await nextChance()
      }
      send({ kind: 'filled', index })
    }
    send({ kind: 'finished' })
  }

  run()
    .catch((error: unknown) => {
      console.error('Rovo run failed', error)
    })
    .finally(() => {
      chrome.runtime.onMessage.removeListener(onMessage)
      delete state.__rovoRun
    })
  return 'started'
}
