import styles from './RunStatusIcon.module.css'

type RunStatusIconProps = {
  status: 'filled' | 'active' | 'pending' | 'failed' | 'alert'
  /** 22px, for the run's header; 18px otherwise. */
  large?: boolean
}

const labels = {
  filled: 'Filled',
  active: 'In progress',
  pending: 'Not yet',
  failed: 'Not filled',
  alert: 'Stopped',
} as const

/** A run step's state, drawn as in the mockup and named for screen readers. */
export function RunStatusIcon({ status, large }: RunStatusIconProps) {
  return (
    <svg
      className={large ? `${styles.root} ${styles.large}` : styles.root}
      viewBox="0 0 24 24"
      role="img"
      aria-label={labels[status]}
    >
      {status === 'filled' && (
        <>
          <circle className={styles.success} cx="12" cy="12" r="10" />
          <path className={styles.mark} d="M7.5 12.5l3 3L16.5 9.5" strokeWidth="2.4" />
        </>
      )}
      {status === 'active' && (
        <g className={styles.spinning}>
          <circle className={styles.ring} cx="12" cy="12" r="9" strokeWidth="3" />
          <path className={styles.arc} d="M12 3a9 9 0 0 1 9 9" strokeWidth="3" />
        </g>
      )}
      {status === 'pending' && (
        <circle className={styles.pending} cx="12" cy="12" r="9" strokeWidth="2" strokeDasharray="3 3" />
      )}
      {status === 'failed' && (
        <>
          <circle className={styles.danger} cx="12" cy="12" r="10" />
          <path className={styles.mark} d="M8.5 8.5l7 7M15.5 8.5l-7 7" strokeWidth="2.4" />
        </>
      )}
      {status === 'alert' && (
        <>
          <circle className={styles.danger} cx="12" cy="12" r="10" />
          <path className={styles.mark} d="M12 7v6M12 16.5v.5" strokeWidth="2.4" />
        </>
      )}
    </svg>
  )
}
