import { useId, type ReactNode, type Ref } from 'react'
import { FieldError } from './FieldError.tsx'
import fieldStyles from './Field.module.css'
import styles from './LineEditor.module.css'

type LineEditorProps = {
  label: string
  /** Shown under the label. */
  help?: ReactNode
  value: string
  onChange: (value: string) => void
  /** Validation message; marks the editor invalid. */
  error?: ReactNode
  /** 1-based line to highlight as the cause of `error`. */
  errorLine?: number | null
  ref?: Ref<HTMLTextAreaElement>
}

/** A monospace multi-line editor with line numbers that grows with its content. */
export function LineEditor({ label, help, value, onChange, error, errorLine, ref }: LineEditorProps) {
  const id = useId()
  const helpId = `${id}-help`
  const errorId = `${id}-error`
  const describedBy = [help && helpId, error && errorId].filter(Boolean).join(' ') || undefined
  const lines = value.split('\n')

  return (
    <div className={fieldStyles.root}>
      <label htmlFor={id} className={fieldStyles.label}>
        {label}
      </label>
      {help && (
        <p id={helpId} className={fieldStyles.help}>
          {help}
        </p>
      )}
      <div className={error ? `${styles.root} ${styles.invalid}` : styles.root}>
        <div className={styles.mirror} aria-hidden="true">
          {lines.map((line, index) => (
            <div key={index} className={index + 1 === errorLine ? `${styles.line} ${styles.lineInvalid}` : styles.line}>
              <span className={styles.number}>{index + 1}</span>
              <span className={styles.text}>{line}</span>
            </div>
          ))}
        </div>
        <textarea
          ref={ref}
          id={id}
          className={styles.input}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
