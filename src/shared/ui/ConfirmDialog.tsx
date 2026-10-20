import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from './Button.tsx'
import { Icon } from './Icon.tsx'
import styles from './ConfirmDialog.module.css'

type ConfirmDialogProps = {
  open: boolean
  title: ReactNode
  body: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

/**
 * A destructive-action confirmation on the native modal `<dialog>`, which
 * traps focus, closes on Escape and dims the panel behind it. Focus starts
 * on Cancel, the safe choice.
 */
export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (open && dialog && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog?.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.root}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
    >
      <div className={styles.header}>
        <span className={styles.badge}>
          <Icon name="warning" size="dialog" />
        </span>
        <div className={styles.text}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <p id={bodyId} className={styles.body}>
            {body}
          </p>
        </div>
      </div>
      <div className={styles.actions}>
        <Button variant="secondary" size="md" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" size="md" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
