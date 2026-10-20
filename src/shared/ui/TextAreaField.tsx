import { useId, type ReactNode, type Ref } from 'react'
import { FieldError } from './FieldError.tsx'
import fieldStyles from './Field.module.css'
import styles from './TextAreaField.module.css'

type TextAreaFieldProps = {
  label: ReactNode
  value: string
  onChange: (value: string) => void
  /** Shown under the textarea. */
  help?: ReactNode
  error?: ReactNode
  ref?: Ref<HTMLTextAreaElement>
  /** A scoped class that overrides the textarea's component tokens (`--textarea-*`). */
  className?: string
}

/** A short multi-line text field (64px tall), e.g. a value typed exactly as it should be entered. */
export function TextAreaField({ label, value, onChange, help, error, ref, className }: TextAreaFieldProps) {
  const id = useId()
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const describedBy = [help && helpId, error && errorId].filter(Boolean).join(' ') || undefined

  return (
    <div className={fieldStyles.root}>
      <label htmlFor={id} className={fieldStyles.label}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={id}
        className={className ? `${styles.textarea} ${className}` : styles.textarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        spellCheck={false}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {help && (
        <span id={helpId} className={styles.help}>
          {help}
        </span>
      )}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
