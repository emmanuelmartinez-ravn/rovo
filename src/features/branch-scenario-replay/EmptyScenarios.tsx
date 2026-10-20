import { useFormLabels } from '@/core/tabs/useFormLabels.ts'
import { Button } from '@/shared/ui/Button.tsx'
import { Notice } from '@/shared/ui/Notice.tsx'
import { Skeleton } from '@/shared/ui/Skeleton.tsx'
import { BranchIcon } from './BranchIcon.tsx'
import styles from './EmptyScenarios.module.css'

/** The card shown until this domain has a scenario. No `onNew`, no button. */
export function EmptyScenarios({ onNew }: { onNew?: () => void }) {
  return (
    <div className={styles.card}>
      <BranchIcon />
      <div className={styles.text}>
        <h3 className={styles.title}>No scenarios for this form yet</h3>
        <p className={styles.hint}>
          Write the path through the form as <code>Label: value</code> lines, in the order you'd fill
          it. Branch choices are lines too.
        </p>
      </div>
      <ExampleScenario />
      {onNew && (
        <Button icon="plus" onClick={onNew}>
          New scenario
        </Button>
      )}
    </div>
  )
}

/** An example built from the current page's own field labels. */
function ExampleScenario() {
  const state = useFormLabels()

  if (state.status === 'loading') {
    return (
      <div className={styles.example}>
        <Skeleton label="Reading the form's labels" />
      </div>
    )
  }
  if (state.status === 'unreadable') {
    return (
      <div className={styles.notice}>
        <Notice>Rovo can't read this page.</Notice>
      </div>
    )
  }
  if (state.labels.length === 0) {
    return (
      <div className={styles.notice}>
        <Notice>Labels for this form couldn't be detected.</Notice>
      </div>
    )
  }
  return <pre className={styles.example}>{state.labels.map((label) => `${label}: ...`).join('\n')}</pre>
}
