import { useId, useRef, useState, type FormEvent } from 'react'
import { targetEntry, type EdgeCase, type Scenario } from '@/core/scenarios/scenario.ts'
import {
  addEdgeCase,
  EdgeCaseNotFoundError,
  ScenarioNotFoundError,
  updateEdgeCase,
} from '@/core/scenarios/scenarioStore.ts'
import { BackButton } from '@/shared/ui/BackButton.tsx'
import { Button } from '@/shared/ui/Button.tsx'
import { FieldError } from '@/shared/ui/FieldError.tsx'
import { Notice } from '@/shared/ui/Notice.tsx'
import { TextAreaField } from '@/shared/ui/TextAreaField.tsx'
import { TextField } from '@/shared/ui/TextField.tsx'
import layout from './ScenarioEditor.module.css'
import styles from './EdgeCaseEditor.module.css'

type EdgeCaseEditorProps = {
  domain: string
  scenario: Scenario
  /** The edge case to edit. Without it, the editor adds a new one. */
  edgeCase?: EdgeCase
  onCancel: () => void
  onSaved: (name: string) => void
}

/**
 * Sets up one edge case: which of the scenario's entries to replace, the
 * value to use instead, and a name. Saving doesn't change the scenario's own
 * entries.
 */
export function EdgeCaseEditor({ domain, scenario, edgeCase, onCancel, onSaved }: EdgeCaseEditorProps) {
  // An orphaned edge case's label isn't among the entries, so nothing is chosen.
  const [label, setLabel] = useState<string | null>(
    edgeCase && targetEntry(scenario, edgeCase) ? edgeCase.label : null,
  )
  const [value, setValue] = useState(edgeCase?.value ?? '')
  const [name, setName] = useState(edgeCase?.name ?? '')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveFailure, setSaveFailure] = useState<string | null>(null)
  const firstOptionRef = useRef<HTMLInputElement>(null)
  const valueRef = useRef<HTMLTextAreaElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const entryErrorId = useId()

  const original = label === null ? undefined : targetEntry(scenario, { label })
  const entryError = submitted && label === null ? 'Choose the entry to replace.' : null
  const valueError =
    submitted && original !== undefined && value === original.value
      ? "That's the scenario's own value. Enter a different one to test."
      : null
  const nameError = submitted && name.trim() === '' ? 'Give the edge case a name.' : null
  // What the tester sees as characters: an emoji or an accented letter counts once.
  const length = Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value)).length

  function save(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (label === null) {
      firstOptionRef.current?.focus()
      return
    }
    if (original !== undefined && value === original.value) {
      valueRef.current?.focus()
      return
    }
    if (name.trim() === '') {
      nameRef.current?.focus()
      return
    }
    const fields = { name: name.trim(), label, value }
    setSaving(true)
    setSaveFailure(null)
    const saved = edgeCase
      ? updateEdgeCase(domain, scenario.id, edgeCase.id, fields)
      : addEdgeCase(domain, scenario.id, fields)
    saved.then(
      () => onSaved(fields.name),
      (error: unknown) => {
        console.error('Failed to save edge case', error)
        setSaving(false)
        setSaveFailure(
          error instanceof ScenarioNotFoundError || error instanceof EdgeCaseNotFoundError
            ? `${error instanceof ScenarioNotFoundError ? 'This scenario' : 'This edge case'} no longer exists. It may have been deleted in another window.`
            : "Couldn't save the edge case. Try again.",
        )
      },
    )
  }

  return (
    <form className={layout.root} onSubmit={save} noValidate>
      <div className={layout.top}>
        <BackButton onClick={onCancel}>Scenarios</BackButton>
        <h2 className={layout.title}>{edgeCase ? 'Edit edge case' : 'New edge case'}</h2>
        <span className={styles.subtitle}>{scenario.name}</span>
      </div>
      <fieldset className={styles.picker} aria-describedby={entryError ? entryErrorId : undefined}>
        <legend className={styles.legend}>1. Entry to replace</legend>
        {scenario.entries.map((entry, index) => (
          <label key={`${index}-${entry.label}`} className={styles.option}>
            <input
              ref={index === 0 ? firstOptionRef : undefined}
              type="radio"
              name="edge-entry"
              checked={label === entry.label}
              onChange={() => setLabel(entry.label)}
            />
            <span className={styles.optionLabel}>{entry.label}</span>
            <span className={styles.optionValue} title={entry.value}>
              {entry.value}
            </span>
          </label>
        ))}
        {entryError && <FieldError id={entryErrorId}>{entryError}</FieldError>}
      </fieldset>
      <TextAreaField
        ref={valueRef}
        className={styles.value}
        label={label === null ? '2. Edge-case value' : `2. Edge-case value for “${label}”`}
        value={value}
        onChange={setValue}
        help={`Entered exactly as typed · ${length} ${length === 1 ? 'character' : 'characters'}. Every other entry runs as written; the scenario's own entries aren't changed.`}
        error={valueError}
      />
      <TextField ref={nameRef} label="Name" value={name} onChange={setName} error={nameError} />
      {saveFailure && <Notice>{saveFailure}</Notice>}
      <div className={layout.actions}>
        <Button type="submit" disabled={saving}>
          {edgeCase ? 'Save changes' : 'Save edge case'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
