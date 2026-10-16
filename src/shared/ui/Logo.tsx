import styles from './Logo.module.css'

/** The Rovo mark. Decorative: place it next to the visible app name. */
export function Logo() {
  return (
    <svg className={styles.root} viewBox="0 0 24 24" aria-hidden="true">
      <rect className={styles.tile} x="2" y="2" width="20" height="20" rx="5" />
      <path
        className={styles.mark}
        d="M8 18V12M8 12V6M8 12c0-2 1.5-3 3.5-3H16M8 12c0 2 1.5 3 3.5 3H16"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
