import { useRef, useState, type FormEvent, type ReactNode } from 'react'
import { formatEntries, parseEntries, type EntriesError, type Scenario } from '@/core/scenarios/scenario.ts'
import { addScenario, FolderNotFoundError, ScenarioNotFoundError, updateScenario } from '@/core/scenarios/scenarioStore.ts'
import { useFormLabels } from '@/core/tabs/useFormLabels.ts'
import { BackButton } from '@/shared/ui/BackButton.tsx'
import { Button } from '@/shared/ui/Button.tsx'
import { LineEditor } from '@/shared/ui/LineEditor.tsx'
import { Notice } from '@/shared/ui/Notice.tsx'
import { TextField } from '@/shared/ui/TextField.tsx'
import styles from './ScenarioEditor.module.css'

type ScenarioEditorProps = {
  domain: string
  /** The form a new scenario is saved into. */
  folderId: string
  /** The scenario to edit. Without it, the editor creates a new one. */
  scenario?: Scenario
  onCancel: () => void
  onSaved: (name: string) => void
}

export function ScenarioEditor({ domain, folderId, scenario, onCancel, onSaved }: ScenarioEditorProps) {
  const labels = useFormLabels()
  const knownLabels = labels.status === 'ready' ? labels.labels : []
  const [name, setName] = useState(scenario?.name ?? '')
  // A new scenario's entries are null until edited: they start as the page's
  // labels, `Label: ` per line, filled in when they've been read.
  const [entriesText, setEntriesText] = useState<string | null>(scenario ? formatEntries(scenario.entries) : null)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveFailure, setSaveFailure] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const entriesRef = useRef<HTMLTextAreaElement>(null)

  const text = entriesText ?? knownLabels.map((label) => `${label}: `).join('\n')
  const parsed = parseEntries(text, knownLabels)
  // Errors show once Save has been tried, then update as the tester fixes them.
  const nameError = submitted && name.trim() === '' ? 'Give the scenario a name.' : null
  const entriesError = submitted ? parsed.error : null

  function save(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (name.trim() === '') {
      nameRef.current?.focus()
      return
    }
    if (parsed.error) {
      entriesRef.current?.focus()
      return
    }
    setSaving(true)
    setSaveFailure(null)
    const saved = scenario
      ? updateScenario(domain, scenario.id, name.trim(), parsed.entries)
      : addScenario(domain, folderId, name.trim(), parsed.entries)
    saved.then(
      () => onSaved(name.trim()),
      (error: unknown) => {
        console.error('Failed to save scenario', error)
        setSaving(false)
        setSaveFailure(
          error instanceof ScenarioNotFoundError || error instanceof FolderNotFoundError
            ? `${error instanceof ScenarioNotFoundError ? 'This scenario' : 'This form'} no longer exists. It may have been deleted in another window.`
            : "Couldn't save the scenario. Try again.",
        )
      },
    )
  }

  return (
    <form className={styles.root} onSubmit={save} noValidate>
      <div className={styles.top}>
        <BackButton onClick={onCancel}>Scenarios</BackButton>
        <h2 className={styles.title}>{scenario ? 'Edit scenario' : 'New scenario'}</h2>
      </div>
      <TextField ref={nameRef} label="Name" value={name} onChange={setName} error={nameError} autoFocus />
      <LineEditor
        ref={entriesRef}
        label="Entries, in path order"
        help={
          <>
            One <code>Label: value</code> per line. Labels must match the text shown on the form.
          </>
        }
        value={text}
        onChange={setEntriesText}
        error={entriesError && entriesMessage(entriesError)}
        errorLine={entriesError && entriesError.kind !== 'noEntries' ? entriesError.line : null}
      />
      {saveFailure && <Notice>{saveFailure}</Notice>}
      <div className={styles.actions}>
        <Button type="submit" disabled={saving}>
          {scenario ? 'Save changes' : 'Save scenario'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function entriesMessage(error: EntriesError): ReactNode {
  switch (error.kind) {
    case 'noEntries':
      return (
        <>
          Add at least one <code>Label: value</code> line.
        </>
      )
    case 'missingColon':
      return (
        <>
          Line {error.line} needs a colon between the label and the value, like{' '}
          <code>{error.suggestion ?? 'Label: value'}</code>.
        </>
      )
    case 'missingLabel':
      return (
        <>
          Line {error.line} needs a label before the colon, like <code>Label: value</code>.
        </>
      )
  }
}
