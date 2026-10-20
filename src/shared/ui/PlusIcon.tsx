import styles from './PlusIcon.module.css'

/** Decorative "+" in the current text color. */
export function PlusIcon() {
  return (
    <svg className={styles.root} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
