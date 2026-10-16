import { useActiveTabDomain } from '@/core/tabs/useActiveTabDomain.ts'
import { Spinner } from '@/shared/ui/Spinner.tsx'
import styles from './CurrentTabDomain.module.css'

export function CurrentTabDomain() {
  const state = useActiveTabDomain()

  return (
    <div className={styles.root}>
      {state.status === 'loading' && <Spinner label="Reading current tab" />}
      {state.status === 'error' && <span>Couldn't read this tab</span>}
      {state.status === 'ready' &&
        (state.domain === null ? (
          <span>No website on this tab</span>
        ) : (
          <span className={styles.domain}>{state.domain}</span>
        ))}
    </div>
  )
}
