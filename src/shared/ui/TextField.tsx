import { useId, type Ref } from 'react'
import { FieldError } from './FieldError.tsx'
import styles from './Field.module.css'

type TextFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string | null
  autoFocus?: boolean
  ref?: Ref<HTMLInputElement>
}

export function TextField({ label, value, onChange, error, autoFocus, ref }: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className={styles.root}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className={styles.input}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        autoFocus={autoFocus}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  )
}
