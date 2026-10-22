import type { ReactNode } from 'react'
import styles from './Icon.module.css'

const icons = {
  plus: <path d="M12 5v14M5 12h14" strokeWidth="2.2" />,
  chevronLeft: <path d="M15 6l-6 6 6 6" strokeWidth="2.2" />,
  chevronDown: <path d="M6 9l6 6 6-6" strokeWidth="2" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="2.2" />,
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" strokeWidth="1.8" />
      <path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" strokeWidth="1.8" />
    </>
  ),
  chevronRight:<path d="M9 6l6 6-6 6" strokeWidth="2.2" />,
  folder: <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" strokeWidth="1.8" />,
  swap: <path d="M4 8h13l-3-3M20 16H7l3 3" strokeWidth="2" />,
  kebab: (
    <>
      <circle className={styles.filled} cx="12" cy="5" r="1.8" />
      <circle className={styles.filled} cx="12" cy="12" r="1.8" />
      <circle className={styles.filled} cx="12" cy="19" r="1.8" />
    </>
  ),
  play: <path className={styles.filled} d="M6 4l14 8-14 8z" />,
  stop: <rect className={styles.filled} x="5" y="5" width="14" height="14" rx="2" />,
  refresh: <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" strokeWidth="2.2" />,
  pencil: <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" strokeWidth="1.8" />,
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" strokeWidth="1.8" />,
  error: (
    <>
      <circle cx="12" cy="12" r="9" strokeWidth="2" />
      <path d="M12 7.5v5.5M12 16.5v.5" strokeWidth="2.2" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3l10 18H2L12 3z" strokeWidth="2" />
      <path d="M12 10v4.5M12 17.5v.5" strokeWidth="2.2" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof icons

type IconProps = {
  name: IconName
  /** tiny 12px, xs 14px, sm 16px (default), menu 18px, dialog 20px. */
  size?: 'tiny' | 'xs' | 'sm' | 'menu' | 'dialog'
}

/** A decorative icon drawn in the current text color. */
export function Icon({ name, size = 'sm' }: IconProps) {
  return (
    <svg className={size === 'sm' ? styles.root : `${styles.root} ${styles[size]}`} viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}
