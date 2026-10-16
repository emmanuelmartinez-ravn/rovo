import { useActiveTabDomain } from '@/core/tabs/useActiveTabDomain.ts'
import { Spinner } from '@/shared/ui/Spinner.tsx'

export function CurrentTabDomain() {
  const state = useActiveTabDomain()

  return (
    <div className="flex min-h-6 items-center text-text-meta">
      {state.status === 'loading' && <Spinner label="Reading current tab" />}
      {state.status === 'error' && <span>Couldn't read this tab</span>}
      {state.status === 'ready' &&
        (state.domain === null ? (
          <span>No website on this tab</span>
        ) : (
          <span className="font-mono text-text-strong">{state.domain}</span>
        ))}
    </div>
  )
}
