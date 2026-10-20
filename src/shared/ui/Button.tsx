import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon.tsx'
import styles from './Button.module.css'

type ButtonProps = {
  children: ReactNode
  /** Decorative icon before the text. */
  icon?: IconName
  /** The icon's size; defaults to xs (14px) on sm buttons and sm (16px) otherwise. */
  iconSize?: 'tiny' | 'xs' | 'sm'
  /** primary (default) filled accent, secondary outlined, danger filled red. */
  variant?: 'primary' | 'secondary' | 'danger'
  /** lg (default) 44px, md 40px, sm 36px. */
  size?: 'lg' | 'md' | 'sm'
  type?: 'button' | 'submit'
  disabled?: boolean
  onClick?: () => void
  /** A scoped class that overrides the button's component tokens (`--button-*`). */
  className?: string
}

export function Button({
  children,
  icon,
  iconSize,
  variant = 'primary',
  size = 'lg',
  type = 'button',
  disabled,
  onClick,
  className: override,
}: ButtonProps) {
  const className = [styles.root, size !== 'lg' && styles[size], variant !== 'primary' && styles[variant], override]
    .filter(Boolean)
    .join(' ')
  return (
    <button type={type} className={className} disabled={disabled} onClick={onClick}>
      {icon && <Icon name={icon} size={iconSize ?? (size === 'sm' ? 'xs' : 'sm')} />}
      {children}
    </button>
  )
}
