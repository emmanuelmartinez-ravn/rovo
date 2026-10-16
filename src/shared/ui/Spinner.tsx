import styles from './Spinner.module.css'
import { VisuallyHidden } from './VisuallyHidden.tsx'

type SpinnerProps = {
  size?: 'sm' | 'md'
  /** Announced to screen readers while the spinner is shown. */
  label?: string
}

export function Spinner({ size = 'sm', label = 'Loading' }: SpinnerProps) {
  return (
    <span
      role="status"
      className={size === 'md' ? `${styles.root} ${styles.md}` : styles.root}
    >
      <span aria-hidden="true" className={styles.ring} />
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  )
}
