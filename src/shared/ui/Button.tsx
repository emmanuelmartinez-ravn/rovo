import type { ReactNode } from 'react'
import styles from './Button.module.css'

type ButtonProps = {
  children: ReactNode
  /** Shown before the text, e.g. `<PlusIcon />`. Decorative. */
  icon?: ReactNode
  onClick?: () => void
}

export function Button({ children, icon, onClick }: ButtonProps) {
  return (
    <button type="button" className={styles.root} onClick={onClick}>
      {icon}
      {children}
    </button>
  )
}
