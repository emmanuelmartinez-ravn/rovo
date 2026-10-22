import { useId, useRef, useState, type FormEvent } from 'react'
import { scenarioCount, type Folder } from '@/core/scenarios/folder.ts'
import type { Scenario } from '@/core/scenarios/scenario.ts'
import { FolderNotFoundError, moveScenario, ScenarioNotFoundError } from '@/core/scenarios/scenarioStore.ts'
import { BackButton } from '@/shared/ui/BackButton.tsx'
import { Button } from '@/shared/ui/Button.tsx'
import { FieldError } from '@/shared/ui/FieldError.tsx'
import { Notice } from '@/shared/ui/Notice.tsx'
import layout from './ScenarioEditor.module.css'
import picker from './EdgeCaseEditor.module.css'
import styles from './MoveScenario.module.css'

type MoveScenarioProps = {
  domain: string
  scenario: Scenario
  /** The forms it can move to: every form on the domain but its own. */
  targets: readonly Folder[]
  onCancel: () => void
  onMoved: (to: Folder) => void
}

/** Picks another form on the domain and moves the scenario, edge cases and all, to its end. */
export function MoveScenario({ domain, scenario, targets, onCancel, onMoved }: MoveScenarioProps) {
  const [targetId, setTargetId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveFailure, setSaveFailure] = useState<string | null>(null)
  const firstOptionRef = useRef<HTMLInputElement>(null)
  const errorId = useId()

  // The chosen form can vanish if another window deletes it.
  const target = targets.find((folder) => folder.id === targetId)
  const targetError = submitted && !target ? 'Choose the form to move it to.' : null

  function save(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (!target) {
      firstOptionRef.current?.focus()
      return
    }
    setSaving(true)
    setSaveFailure(null)
    moveScenario(domain, scenario.id, target.id).then(
      () => onMoved(target),
      (error: unknown) => {
        console.error('Failed to move scenario', error)
        setSaving(false)
        setSaveFailure(
          error instanceof ScenarioNotFoundError || error instanceof FolderNotFoundError
            ? `${error instanceof ScenarioNotFoundError ? 'This scenario' : 'That form'} no longer exists. It may have been deleted in another window.`
            : "Couldn't move the scenario. Try again.",
        )
      },
    )
  }

  return (
    <form className={layout.root} onSubmit={save} noValidate>
      <div className={layout.top}>
        <BackButton onClick={onCancel}>Scenarios</BackButton>
        <h2 className={layout.title}>Move scenario</h2>
        <span className={picker.subtitle}>{scenario.name}</span>
      </div>
      <fieldset className={picker.picker} aria-describedby={targetError ? errorId : undefined}>
        <legend className={picker.legend}>Move to form</legend>
        {targets.map((folder, index) => (
          <label key={folder.id} className={`${picker.option} ${styles.option}`}>
            <input
              ref={index === 0 ? firstOptionRef : undefined}
              type="radio"
              name="move-target"
              checked={targetId === folder.id}
              onChange={() => setTargetId(folder.id)}
            />
            <span className={picker.optionLabel}>{folder.name}</span>
            <span className={picker.optionValue}>{scenarioCount(folder)}</span>
          </label>
        ))}
        {targetError && <FieldError id={errorId}>{targetError}</FieldError>}
      </fieldset>
      <p className={styles.help}>Its entries and saved edge cases move with it, to the end of that form's list.</p>
      {saveFailure && <Notice>{saveFailure}</Notice>}
      <div className={layout.actions}>
        <Button type="submit" disabled={saving}>
          Move scenario
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
