import type { ReactNode } from 'react'
import { Icon } from './Icon.tsx'
import styles from './BackButton.module.css'

export function BackButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" className={styles.root} onClick={onClick}>
      <Icon name="chevronLeft" size="xs" />
      {children}
    </button>
  )
}
