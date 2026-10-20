import type { ReactNode } from 'react'
import styles from './Banner.module.css'

/** A success confirmation, announced politely when it appears. */
export function Banner({ children }: { children: ReactNode }) {
  return (
    <div role="status" className={styles.root}>
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
        <circle className={styles.iconDisc} cx="12" cy="12" r="9" />
        <path className={styles.iconMark} d="M8 12.5l2.7 2.7L16 10" strokeWidth="2.2" />
      </svg>
      {children}
    </div>
  )
}
