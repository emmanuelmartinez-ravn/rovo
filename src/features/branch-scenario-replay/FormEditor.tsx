import { useRef, useState, type FormEvent } from 'react'
import { folderNameError, type Folder, type FolderNameError } from '@/core/scenarios/folder.ts'
import {
  addFolder,
  FolderNameTakenError,
  FolderNotFoundError,
  renameFolder,
} from '@/core/scenarios/scenarioStore.ts'
import { BackButton } from '@/shared/ui/BackButton.tsx'
import { Button } from '@/shared/ui/Button.tsx'
import { Notice } from '@/shared/ui/Notice.tsx'
import { TextField } from '@/shared/ui/TextField.tsx'
import layout from './ScenarioEditor.module.css'

type FormEditorProps = {
  domain: string
  /** The domain's forms, for checking the name isn't taken. */
  folders: readonly Folder[]
  /** The form to rename. Without it, the editor creates a new one. */
  folder?: Folder
  onCancel: () => void
  onSaved: (name: string) => void
}

/** Names a new form, or renames one. Its scenarios aren't changed. */
export function FormEditor({ domain, folders, folder, onCancel, onSaved }: FormEditorProps) {
  const [name, setName] = useState(folder?.name ?? '')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveFailure, setSaveFailure] = useState<string | null>(null)
  const nameRef = useRef<HTMLInputElement>(null)

  const error = folderNameError(name, folders, folder?.id)
  // Errors show once Save has been tried, then update as the tester fixes them.
  const nameError = submitted && error ? nameMessage(error) : null

  function save(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (error) {
      nameRef.current?.focus()
      return
    }
    setSaving(true)
    setSaveFailure(null)
    const saved = folder ? renameFolder(domain, folder.id, name) : addFolder(domain, name)
    saved.then(
      () => onSaved(name.trim()),
      (failure: unknown) => {
        console.error('Failed to save form', failure)
        setSaving(false)
        setSaveFailure(
          failure instanceof FolderNameTakenError
            ? `A form named “${failure.existing}” already exists on this site.`
            : failure instanceof FolderNotFoundError
              ? 'This form no longer exists. It may have been deleted in another window.'
              : "Couldn't save the form. Try again.",
        )
      },
    )
  }

  return (
    <form className={layout.root} onSubmit={save} noValidate>
      <div className={layout.top}>
        <BackButton onClick={onCancel}>Forms</BackButton>
        <h2 className={layout.title}>{folder ? 'Rename form' : 'New form'}</h2>
      </div>
      <TextField ref={nameRef} label="Name" value={name} onChange={setName} error={nameError} autoFocus />
      {saveFailure && <Notice>{saveFailure}</Notice>}
      <div className={layout.actions}>
        <Button type="submit" disabled={saving}>
          {folder ? 'Save changes' : 'Save form'}
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function nameMessage(error: FolderNameError): string {
  switch (error.kind) {
    case 'empty':
      return 'Give the form a name.'
    case 'taken':
      return `A form named “${error.existing.name}” already exists on this site.`
  }
}
