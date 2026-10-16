import { useActiveTabDomain } from '@/core/tabs/useActiveTabDomain.ts'
import { Spinner } from '@/shared/ui/Spinner.tsx'
import styles from './CurrentTabDomain.module.css'

export function CurrentTabDomain() {
  const state = useActiveTabDomain()

  return (
    <div className={styles.root}>
      {state.status === 'loading' && <Spinner label="Reading current tab" />}
      {state.status === 'error' && (
        <span className={styles.message}>Couldn't read this tab</span>
      )}
      {state.status === 'ready' &&
        (state.domain === null ? (
          <span className={styles.message}>No website on this tab</span>
        ) : (
          <span className={styles.domain} title={state.domain}>
            {state.domain}
          </span>
        ))}
    </div>
  )
}
