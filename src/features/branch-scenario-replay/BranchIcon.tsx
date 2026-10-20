import styles from './EmptyScenarios.module.css'

/** The branching-path mark from the empty state. Decorative. */
export function BranchIcon() {
  return (
    <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
      <path
        className={styles.iconPath}
        d="M6 20V12M6 12V4M6 12c0-2.5 2-4 4.5-4H18M6 12c0 2.5 2 4 4.5 4H18"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle className={styles.iconDot} cx="18" cy="8" r="1.8" />
      <circle className={styles.iconDot} cx="18" cy="16" r="1.8" />
    </svg>
  )
}
