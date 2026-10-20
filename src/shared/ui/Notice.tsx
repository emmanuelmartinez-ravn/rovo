import type { ReactNode } from 'react'
import styles from './Notice.module.css'

/** A short warning that something couldn't be done, announced politely. */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <p role="status" className={styles.root}>
      {children}
    </p>
  )
}
