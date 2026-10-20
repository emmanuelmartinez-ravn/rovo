import { useState, type ReactNode } from 'react'
import type { EdgeCase, Scenario } from '@/core/scenarios/scenario.ts'
import { deleteEdgeCase, deleteScenario } from '@/core/scenarios/scenarioStore.ts'
import { useScenarios } from '@/core/scenarios/useScenarios.ts'
import { useScenarioRun } from '@/core/run/useScenarioRun.ts'
import { useActiveTabDomain } from '@/core/tabs/useActiveTabDomain.ts'
import { Banner } from '@/shared/ui/Banner.tsx'
import { Button } from '@/shared/ui/Button.tsx'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog.tsx'
import { Notice } from '@/shared/ui/Notice.tsx'
import { Skeleton } from '@/shared/ui/Skeleton.tsx'
import { EdgeCaseEditor } from './EdgeCaseEditor.tsx'
import { EmptyScenarios } from './EmptyScenarios.tsx'
import { RunView } from './RunView.tsx'
import { ScenarioCard } from './ScenarioCard.tsx'
import { ScenarioEditor } from './ScenarioEditor.tsx'
import styles from './ScenariosPanel.module.css'

/** What the delete confirmation is about. */
type Deleting = { kind: 'scenario'; scenario: Scenario } | { kind: 'edgeCase'; scenario: Scenario; edgeCase: EdgeCase }

/** Scenarios are saved per domain, so the panel follows the active tab's. */
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
  // Keyed by domain: switching sites starts over on the list, banner cleared.
  return <DomainScenarios key={tab.domain} domain={tab.domain} />
}

function DomainScenarios({ domain }: { domain: string }) {
  const scenarios = useScenarios(domain)
  const [view, setView] = useState<
    | { kind: 'list' }
    | { kind: 'editor'; editing?: Scenario }
    | { kind: 'edgeCaseEditor'; scenario: Scenario; editing?: EdgeCase }
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
    return (scenarios.status === 'ready' && scenarios.scenarios.find((s) => s.id === scenario.id)) || scenario
  }

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
  if (scenarios.status === 'loading') {
    return <LoadingView />
  }

  const messages: ReactNode = (
    <>
      {banner && <Banner>{banner}</Banner>}
      {problem && <Notice>{problem}</Notice>}
    </>
  )

  if (scenarios.status === 'error') {
    return (
      <section className={styles.listView}>
        <Heading />
        <Notice>Couldn't load the saved scenarios.</Notice>
      </section>
    )
  }
  if (scenarios.scenarios.length === 0) {
    return (
      <section className={styles.emptyView}>
        {messages}
        <Heading />
        <EmptyScenarios onNew={() => openEditor()} />
      </section>
    )
  }
  return (
    <section className={styles.listView}>
      {messages}
      <div className={styles.listHeader}>
        <Heading />
        <Button variant="secondary" size="sm" icon="plus" onClick={() => openEditor()}>
          New
        </Button>
      </div>
      <ul className={styles.list}>
        {scenarios.scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            edgeCasesExpanded={expanded.has(scenario.id)}
            onToggleEdgeCases={() => toggleEdgeCases(scenario.id)}
            onEdit={() => openEditor(scenario)}
            onDelete={() => setDeleting({ kind: 'scenario', scenario })}
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

function LoadingView() {
  return (
    <section className={styles.listView}>
      <Heading />
      <Skeleton label="Loading scenarios" />
    </section>
  )
}
