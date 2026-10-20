import { useState, type ReactNode } from 'react'
import type { EdgeCase, Scenario } from '@/core/scenarios/scenario.ts'
import { deleteScenario } from '@/core/scenarios/scenarioStore.ts'
import { useScenarios } from '@/core/scenarios/useScenarios.ts'
import { useActiveTabDomain } from '@/core/tabs/useActiveTabDomain.ts'
import { Banner } from '@/shared/ui/Banner.tsx'
import { Button } from '@/shared/ui/Button.tsx'
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog.tsx'
import { Notice } from '@/shared/ui/Notice.tsx'
import { Skeleton } from '@/shared/ui/Skeleton.tsx'
import { EdgeCaseEditor } from './EdgeCaseEditor.tsx'
import { EmptyScenarios } from './EmptyScenarios.tsx'
import { ScenarioCard } from './ScenarioCard.tsx'
import { ScenarioEditor } from './ScenarioEditor.tsx'
import styles from './ScenariosPanel.module.css'

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
  >({ kind: 'list' })
  // Shown until the tester leaves the list.
  const [banner, setBanner] = useState<string | null>(null)
  const [problem, setProblem] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Scenario | null>(null)
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
    const { id, name } = deleting
    setDeleting(null)
    deleteScenario(domain, id).then(
      () => {
        setProblem(null)
        setBanner(`Scenario “${name}” deleted`)
      },
      (error: unknown) => {
        console.error('Failed to delete scenario', error)
        setBanner(null)
        setProblem(`Couldn't delete “${name}”. Try again.`)
      },
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
            onDelete={() => setDeleting(scenario)}
            onAddEdgeCase={() => openEdgeCaseEditor(scenario)}
            onEditEdgeCase={(edgeCase) => openEdgeCaseEditor(scenario, edgeCase)}
          />
        ))}
      </ul>
      <ConfirmDialog
        open={deleting !== null}
        title={`Delete “${deleting?.name ?? ''}”?`}
        body="The scenario will be permanently deleted. This can’t be undone."
        confirmLabel="Delete scenario"
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </section>
  )
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
