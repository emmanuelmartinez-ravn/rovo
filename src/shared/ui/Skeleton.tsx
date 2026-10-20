import styles from './Skeleton.module.css'
import { VisuallyHidden } from './VisuallyHidden.tsx'

const widths = ['long', 'medium', 'short'] as const

type SkeletonProps = {
  /** Number of placeholder text lines. */
  lines?: number
  /** Announced to screen readers while the skeleton is shown. */
  label?: string
}

/** Placeholder text lines for content that's still loading. */
export function Skeleton({ lines = 3, label = 'Loading' }: SkeletonProps) {
  return (
    <span role="status" className={styles.root}>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} aria-hidden="true" className={`${styles.line} ${styles[widths[i % widths.length]]}`} />
      ))}
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  )
}
