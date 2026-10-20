/** Message the injected watcher sends whenever the page's field labels change. */
export const FORM_LABELS_MESSAGE = 'rovo:form-labels'

export type FormLabelsMessage = { type: typeof FORM_LABELS_MESSAGE; labels: string[] }

export function isFormLabelsMessage(value: unknown): value is FormLabelsMessage {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    value.type === FORM_LABELS_MESSAGE &&
    'labels' in value &&
    Array.isArray(value.labels) &&
    value.labels.every((label: unknown) => typeof label === 'string')
  )
}

/**
 * Injected into the tested page with `chrome.scripting.executeScript`, which
 * serializes it by source: it must not reference anything outside its own
 * body (the message type is repeated as a literal for that reason).
 *
 * Returns the page's field labels in DOM order, and keeps watching the page:
 * whenever the labels change (a conditional field appears or goes away), it
 * sends a `FORM_LABELS_MESSAGE` to the extension. Injecting it again into
 * the same page reuses the running watcher.
 *
 * A field's label is its `<label>` (for= or wrapping), else
 * `aria-labelledby`, else `aria-label`. Radio and checkbox groups inside a
 * `<fieldset>` use its `<legend>`, so options ("Personal", "Business") aren't
 * listed. Hidden fields are skipped, and each label is listed once.
 */
export function watchFormLabels(): string[] {
  const text = (el: Element): string => {
    const copy = el.cloneNode(true)
    if (copy instanceof Element) {
      copy.querySelectorAll('input, select, textarea, option').forEach((n) => n.remove())
    }
    return (copy.textContent ?? '').replace(/\s+/g, ' ').trim()
  }
  const isShown = (el: Element): boolean =>
    el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'
  const byIds = (ids: string): string =>
    ids
      .split(/\s+/)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
      .map(text)
      .join(' ')
      .trim()

  const labelFor = (field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): string => {
    const isOption = field instanceof HTMLInputElement && (field.type === 'radio' || field.type === 'checkbox')
    if (isOption) {
      const legend = field.closest('fieldset')?.querySelector(':scope > legend')
      if (legend) {
        return text(legend)
      }
    }
    const label = field.labels?.[0]
    if (label) {
      return text(label)
    }
    const labelledBy = field.getAttribute('aria-labelledby')
    if (labelledBy) {
      return byIds(labelledBy)
    }
    return (field.getAttribute('aria-label') ?? '').trim()
  }

  const collect = (): string[] => {
    const labels: string[] = []
    const skipped = new Set(['hidden', 'submit', 'button', 'reset', 'image'])
    for (const field of document.querySelectorAll('input, select, textarea')) {
      if (
        !(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) ||
        (field instanceof HTMLInputElement && skipped.has(field.type)) ||
        !isShown(field.labels?.[0] ?? field)
      ) {
        continue
      }
      const label = labelFor(field)
      if (label && !labels.includes(label)) {
        labels.push(label)
      }
    }
    return labels
  }

  type Watcher = { labels: string[] }
  const state = globalThis as typeof globalThis & { __rovoFormLabels?: Watcher }
  const existing = state.__rovoFormLabels
  if (existing) {
    existing.labels = collect()
    return existing.labels
  }

  const watcher: Watcher = { labels: collect() }
  state.__rovoFormLabels = watcher
  let timer: ReturnType<typeof setTimeout> | undefined
  const observer = new MutationObserver(() => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      const next = collect()
      if (next.join('\n') === watcher.labels.join('\n')) {
        return
      }
      watcher.labels = next
      try {
        // No listener (panel closed) rejects; a reloaded extension throws.
        chrome.runtime.sendMessage({ type: 'rovo:form-labels', labels: next }).catch(() => {})
      } catch {
        observer.disconnect()
      }
    }, 200)
  })
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['hidden', 'style', 'class', 'type', 'open', 'aria-label', 'aria-labelledby'],
  })
  return watcher.labels
}
