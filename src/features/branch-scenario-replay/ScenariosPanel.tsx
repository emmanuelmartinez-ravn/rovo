import { useState, type ReactNode } from 'react'
import type { Folder } from '@/core/scenarios/folder.ts'
import type { EdgeCase, Scenario } from '@/core/scenarios/scenario.ts'
import { deleteEdgeCase, deleteFolder, deleteScenario } from '@/core/scenarios/scenarioStore.ts'
import { useFolders } from '@/core/scenarios/useFolders.ts'
import { useScenarioRun } from '@/core/run/useScenarioRun.ts'
import { useActiveTabDomain } from '@/core/tabs/useActiveTabDomain.ts'
import { BackButton } from '@/shared/ui/BackButton.tsx'
import { Banner } from '@/shared/ui/Banner.tsx'
import { Button } from '@/shared/ui/Button.tsx'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog.tsx'
import { Notice } from '@/shared/ui/Notice.tsx'
import { Skeleton } from '@/shared/ui/Skeleton.tsx'
import { EdgeCaseEditor } from './EdgeCaseEditor.tsx'
import { EmptyForms } from './EmptyForms.tsx'
import { EmptyScenarios } from './EmptyScenarios.tsx'
import { FormCard } from './FormCard.tsx'
import { FormEditor } from './FormEditor.tsx'
import { MoveScenario } from './MoveScenario.tsx'
import { RunView } from './RunView.tsx'
import { ScenarioCard } from './ScenarioCard.tsx'
import { ScenarioEditor } from './ScenarioEditor.tsx'
import styles from './ScenariosPanel.module.css'

/** What the delete confirmation is about. */
type Deleting = { kind: 'scenario'; scenario: Scenario } | { kind: 'edgeCase'; scenario: Scenario; edgeCase: EdgeCase }

/** Forms are saved per domain, so the panel follows the active tab's. */
export function ScenariosPanel() {
  const tab = useActiveTabDomain()

  if (tab.status === 'loading') {
    return <LoadingView />
  }
  if (tab.status === 'error' || tab.domain === null) {
    // Nothing to save scenarios against: the card explains why.
    return (
      <section className={styles.emptyView}>
        <Heading />
        <EmptyScenarios />
      </section>
    )
  }
  // Keyed by domain: switching sites starts over on the forms list, banner cleared.
  return <DomainForms key={tab.domain} domain={tab.domain} />
}

type FormsView =
  | { kind: 'list' }
  | { kind: 'editor'; editing?: Folder }
  // `name` says which form it was if it's deleted while open.
  | { kind: 'form'; id: string; name: string }

/** The domain's forms, and the one open, if any. */
function DomainForms({ domain }: { domain: string }) {
  const folders = useFolders(domain)
  const [view, setView] = useState<FormsView>({ kind: 'list' })
  // Shown until the tester leaves the list.
  const [banner, setBanner] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Folder | null>(null)

  function show(next: FormsView) {
    setBanner(null)
    setProblem(null)
    setView(next)
  }

  function confirmDelete() {
    if (!deleting) {
      return
    }
    const { id, name } = deleting
    setDeleting(null)
    deleteFolder(domain, id).then(
      () => {
        setProblem(null)
        setBanner(`Form “${name}” deleted`)
      },
      (error: unknown) => {
        console.error('Failed to delete form', error)
        setBanner(null)
        setProblem(`Couldn't delete “${name}”. Try again.`)
      },
    )
  }

  if (folders.status === 'loading') {
    return <LoadingView />
  }
  if (folders.status === 'error') {
    return (
      <section className={styles.listView}>
        <FormsHeading />
        <Notice>Couldn't load the saved forms.</Notice>
      </section>
    )
  }
  if (view.kind === 'editor') {
    const { editing } = view
    return (
      <FormEditor
        domain={domain}
        folders={folders.folders}
        folder={editing}
        onCancel={() => show({ kind: 'list' })}
        onSaved={(name) => {
          setView({ kind: 'list' })
          setBanner(`Form “${name}” ${editing ? 'renamed' : 'saved'}`)
        }}
      />
    )
  }

  const open = view.kind === 'form' ? folders.folders.find((folder) => folder.id === view.id) : undefined
  if (open) {
    // Keyed by form: leaving it and coming back starts over, edge cases collapsed.
    return (
      <FormScenarios
        key={open.id}
        domain={domain}
        folder={open}
        folders={folders.folders}
        onBack={() => show({ kind: 'list' })}
      />
    )
  }
  // Still on a form that isn't there: it was deleted in another window.
  const notice = view.kind === 'form' ? `The form “${view.name}” was deleted in another window.` : problem

  const messages: ReactNode = (
    <>
      {banner && <Banner>{banner}</Banner>}
      {notice && <Notice>{notice}</Notice>}
    </>
  )

  if (folders.folders.length === 0) {
    return (
      <section className={styles.emptyView}>
        {messages}
        <FormsHeading />
        <EmptyForms onNew={() => show({ kind: 'editor' })} />
      </section>
    )
  }
  return (
    <section className={styles.listView}>
      {messages}
      <div className={styles.listHeader}>
        <FormsHeading />
        <Button variant="secondary" size="sm" icon="plus" onClick={() => show({ kind: 'editor' })}>
          New
        </Button>
      </div>
      <ul className={styles.list}>
        {folders.folders.map((folder) => (
          <FormCard
            key={folder.id}
            folder={folder}
            onOpen={() => show({ kind: 'form', id: folder.id, name: folder.name })}
            onRename={() => show({ kind: 'editor', editing: folder })}
            onDelete={() => setDeleting(folder)}
          />
        ))}
      </ul>
      <ConfirmDialog
        open={deleting !== null}
        {...deleteFormCopy(deleting)}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </section>
  )
}

type FormScenariosProps = {
  domain: string
  folder: Folder
  /** Every form on the domain, for moving a scenario to another. */
  folders: readonly Folder[]
  onBack: () => void
}

/** One form's scenarios: create, edit, run, edge cases and moves. */
function FormScenarios({ domain, folder, folders, onBack }: FormScenariosProps) {
  const [view, setView] = useState<
    | { kind: 'list' }
    | { kind: 'editor'; editing?: Scenario }
    | { kind: 'edgeCaseEditor'; scenario: Scenario; editing?: EdgeCase }
    | { kind: 'move'; scenario: Scenario }
    | { kind: 'run' }
  >({ kind: 'list' })
  const run = useScenarioRun()
  // Shown until the tester leaves the list.
  const [banner, setBanner] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Deleting | null>(null)
  // Scenario ids whose "Saved edge cases" section is open; they start collapsed.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set())

  function toggleEdgeCases(id: string) {
    setExpanded((current) => {
      const next = new Set(current)
      if (!next.delete(id)) {
        next.add(id)
      }
      return next
    })
  }

  /** Opens the edge-case editor for `scenario`, on `editing` or on a new edge case. */
  function openEdgeCaseEditor(scenario: Scenario, editing?: EdgeCase) {
    setBanner(null)
    setProblem(null)
    setView({ kind: 'edgeCaseEditor', scenario, editing })
  }

  /** Opens the editor on `editing`, or on a new scenario without it. */
  function openEditor(editing?: Scenario) {
    setBanner(null)
    setProblem(null)
    setView({ kind: 'editor', editing })
  }

  function openMove(scenario: Scenario) {
    setBanner(null)
    setProblem(null)
    setView({ kind: 'move', scenario })
  }

  function confirmDelete() {
    if (!deleting) {
      return
    }
    setDeleting(null)
    const [deleted, done] =
      deleting.kind === 'scenario'
        ? [deleteScenario(domain, deleting.scenario.id), `Scenario “${deleting.scenario.name}” deleted`]
        : [
            deleteEdgeCase(domain, deleting.scenario.id, deleting.edgeCase.id),
            `Edge case “${deleting.edgeCase.name}” deleted`,
          ]
    const name = deleting.kind === 'scenario' ? deleting.scenario.name : deleting.edgeCase.name
    deleted.then(
      () => {
        setProblem(null)
        setBanner(done)
      },
      (error: unknown) => {
        console.error('Failed to delete', error)
        setBanner(null)
        setProblem(`Couldn't delete “${name}”. Try again.`)
      },
    )
  }

  function startRun(scenario: Scenario, edgeCase?: EdgeCase) {
    setBanner(null)
    setProblem(null)
    run.start(scenario, edgeCase)
    setView({ kind: 'run' })
  }

  /** The stored version of a run's scenario, which may have changed since it started. */
  function latest(scenario: Scenario): Scenario {
    return folder.scenarios.find((s) => s.id === scenario.id) ?? scenario
  }

  const targets = folders.filter((other) => other.id !== folder.id)

  if (view.kind === 'run' && run.state.status !== 'idle') {
    const current = run.state
    const ran = 'scenario' in current ? current : null
    const leave = (next: () => void) => {
      run.reset()
      next()
    }
    return (
      <RunView
        state={current}
        onStop={run.stop}
        onRunAgain={() => ran && startRun(latest(ran.scenario), ran.edgeCase)}
        onEditScenario={() => ran && leave(() => openEditor(latest(ran.scenario)))}
        onAddEdgeCase={() => ran && leave(() => openEdgeCaseEditor(latest(ran.scenario)))}
        onBack={() => leave(() => setView({ kind: 'list' }))}
      />
    )
  }
  if (view.kind === 'editor') {
    const { editing } = view
    return (
      <ScenarioEditor
        domain={domain}
        folderId={folder.id}
        scenario={editing}
        onCancel={() => setView({ kind: 'list' })}
        onSaved={(name) => {
          setBanner(`Scenario “${name}” ${editing ? 'updated' : 'saved'}`)
          setView({ kind: 'list' })
        }}
      />
    )
  }
  if (view.kind === 'edgeCaseEditor') {
    const { scenario, editing } = view
    return (
      <EdgeCaseEditor
        domain={domain}
        scenario={scenario}
        edgeCase={editing}
        onCancel={() => setView({ kind: 'list' })}
        onSaved={(name) => {
          setBanner(`Edge case “${name}” ${editing ? 'updated' : 'saved'}`)
          // Open the section so the tester sees what they just saved.
          setExpanded((current) => new Set(current).add(scenario.id))
          setView({ kind: 'list' })
        }}
      />
    )
  }
  if (view.kind === 'move') {
    const { scenario } = view
    return (
      <MoveScenario
        domain={domain}
        scenario={scenario}
        targets={targets}
        onCancel={() => setView({ kind: 'list' })}
        onMoved={(to) => {
          setBanner(`Scenario “${scenario.name}” moved to “${to.name}”`)
          setView({ kind: 'list' })
        }}
      />
    )
  }

  const messages: ReactNode = (
    <>
      {banner && <Banner>{banner}</Banner>}
      {problem && <Notice>{problem}</Notice>}
    </>
  )

  const top = (
    <div className={styles.top}>
      <BackButton onClick={onBack}>Forms</BackButton>
      <div className={styles.listHeader}>
        <h2 className={styles.heading}>{folder.name}</h2>
        {folder.scenarios.length > 0 && (
          <Button variant="secondary" size="sm" icon="plus" onClick={() => openEditor()}>
            New
          </Button>
        )}
      </div>
    </div>
  )

  if (folder.scenarios.length === 0) {
    return (
      <section className={styles.emptyView}>
        {messages}
        {top}
        <EmptyScenarios onNew={() => openEditor()} />
      </section>
    )
  }
  return (
    <section className={styles.listView}>
      {messages}
      {top}
      <ul className={styles.list}>
        {folder.scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            edgeCasesExpanded={expanded.has(scenario.id)}
            onToggleEdgeCases={() => toggleEdgeCases(scenario.id)}
            onEdit={() => openEditor(scenario)}
            onDelete={() => setDeleting({ kind: 'scenario', scenario })}
            onMove={targets.length > 0 ? () => openMove(scenario) : undefined}
            onRun={() => startRun(scenario)}
            onRunEdgeCase={(edgeCase) => startRun(scenario, edgeCase)}
            onAddEdgeCase={() => openEdgeCaseEditor(scenario)}
            onEditEdgeCase={(edgeCase) => openEdgeCaseEditor(scenario, edgeCase)}
            onDeleteEdgeCase={(edgeCase) => setDeleting({ kind: 'edgeCase', scenario, edgeCase })}
          />
        ))}
      </ul>
      <p className={styles.footnote}>
        A run fills the form open in this tab, top to bottom. Reload the page first to start from a fresh form.
      </p>
      <ConfirmDialog
        open={deleting !== null}
        {...deleteCopy(deleting)}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </section>
  )
}

function deleteFormCopy(folder: Folder | null): { title: string; body: string; confirmLabel: string } {
  const count = folder?.scenarios.length ?? 0
  return {
    title: `Delete “${folder?.name ?? ''}”?`,
    body:
      count === 0
        ? 'The form will be permanently deleted. This can’t be undone.'
        : `The form and its ${count} scenario${count === 1 ? '' : 's'}, with their saved edge cases, will be permanently deleted. This can’t be undone.`,
    confirmLabel: 'Delete form',
  }
}

/** The mockup's wording for each kind of delete. */
function deleteCopy(deleting: Deleting | null): { title: string; body: string; confirmLabel: string } {
  if (deleting?.kind === 'edgeCase') {
    return {
      title: `Delete edge case “${deleting.edgeCase.name}”?`,
      body: `It will be removed from “${deleting.scenario.name}”. The scenario itself isn’t changed. This can’t be undone.`,
      confirmLabel: 'Delete edge case',
    }
  }
  const count = deleting?.scenario.edgeCases.length ?? 0
  const edgeCases = count === 0 ? '' : ` and its ${count} saved edge case${count === 1 ? '' : 's'}`
  return {
    title: `Delete “${deleting?.scenario.name ?? ''}”?`,
    body: `The scenario${edgeCases} will be permanently deleted. This can’t be undone.`,
    confirmLabel: 'Delete scenario',
  }
}

function Heading() {
  return <h2 className={styles.heading}>Scenarios for this form</h2>
}

function FormsHeading() {
  return <h2 className={styles.heading}>Forms on this site</h2>
}

function LoadingView() {
  return (
    <section className={styles.listView}>
      <FormsHeading />
      <Skeleton label="Loading forms" />
    </section>
  )
}
