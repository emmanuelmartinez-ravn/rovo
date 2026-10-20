import type { ReactNode } from 'react'
import { Icon } from './Icon.tsx'
import styles from './FieldError.module.css'

/** A field's validation message. Announced when it appears. */
export function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div id={id} role="alert" className={styles.root}>
      <Icon name="error" />
      <span>{children}</span>
    </div>
  )
}
