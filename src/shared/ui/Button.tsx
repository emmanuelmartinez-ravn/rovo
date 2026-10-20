import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon.tsx'
import styles from './Button.module.css'

type ButtonProps = {
  children: ReactNode
  /** Decorative icon before the text. */
  icon?: IconName
  /** primary (default) filled accent, secondary outlined, danger filled red. */
  variant?: 'primary' | 'secondary' | 'danger'
  /** lg (default) 44px, md 40px, sm 36px. */
  size?: 'lg' | 'md' | 'sm'
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
}

export function Button({ children, icon, variant = 'primary', size = 'lg', type = 'button', disabled, onClick }: ButtonProps) {
  const className = [styles.root, size !== 'lg' && styles[size], variant !== 'primary' && styles[variant]]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={className} disabled={disabled} onClick={onClick}>
      {icon && <Icon name={icon} size={size === 'sm' ? 'xs' : 'sm'} />}
      {children}
    </button>
  )
}
