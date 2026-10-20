import { useEffect, useId, useRef, useState } from 'react'
import { Icon, type IconName } from './Icon.tsx'
import styles from './ActionMenu.module.css'

export type Action = {
  label: string
  icon: IconName
  tone?: 'danger'
  onSelect: () => void
}

type ActionMenuProps = {
  /** Accessible name of the ⋮ trigger, e.g. "More actions for Business — LLC". */
  label: string
  actions: Action[]
  /** A scoped class that overrides the menu's component tokens (`--menu-*`). */
  className?: string
}

/**
 * A ⋮ button that discloses a short list of action buttons. Built as a
 * disclosure (button + list of buttons) so it needs no menu roles or roving
 * focus: Tab moves through the actions, Escape or a click outside closes it.
 */
export function ActionMenu({ label, actions, className }: ActionMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={className ? `${styles.root} ${className}` : styles.root}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name="kebab" size="menu" />
      </button>
      {open && (
        <div id={listId} className={styles.menu}>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={action.tone === 'danger' ? `${styles.item} ${styles.danger}` : styles.item}
              onClick={() => {
                setOpen(false)
                action.onSelect()
              }}
            >
              <Icon name={action.icon} />
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
