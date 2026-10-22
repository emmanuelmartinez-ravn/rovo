import { isOrphaned, type EdgeCase, type Scenario } from '@/core/scenarios/scenario.ts'
import { ActionMenu } from '@/shared/ui/ActionMenu.tsx'
import { Button } from '@/shared/ui/Button.tsx'
import { Icon } from '@/shared/ui/Icon.tsx'
import { EdgeCaseSection } from './EdgeCaseSection.tsx'
import styles from './ScenarioCard.module.css'

type ScenarioCardProps = {
  scenario: Scenario
  /** Whether the "Saved edge cases" section is open. */
  edgeCasesExpanded: boolean
  onToggleEdgeCases: () => void
  onEdit: () => void
  onDelete: () => void
  /** Moves the scenario to another form. Without it, there's no other form to move to. */
  onMove?: () => void
  onRun: () => void
  onRunEdgeCase: (edgeCase: EdgeCase) => void
  onAddEdgeCase: () => void
  onEditEdgeCase: (edgeCase: EdgeCase) => void
  onDeleteEdgeCase: (edgeCase: EdgeCase) => void
}

export function ScenarioCard({
  scenario,
  edgeCasesExpanded,
  onToggleEdgeCases,
  onEdit,
  onDelete,
  onMove,
  onRun,
  onRunEdgeCase,
  onAddEdgeCase,
  onEditEdgeCase,
  onDeleteEdgeCase,
}: ScenarioCardProps) {
  const [first] = scenario.entries
  const count = scenario.entries.length
  const meta = `${first ? `${first.label}: ${first.value} · ` : ''}${count} ${count === 1 ? 'entry' : 'entries'}`

  return (
    <li className={styles.root}>
      <div className={styles.header}>
        <div className={styles.text}>
          <h3 className={styles.title}>{scenario.name}</h3>
          <span className={styles.meta}>{meta}</span>
        </div>
        <ActionMenu
          label={`More actions for ${scenario.name}`}
          actions={[
            { label: 'Edit scenario', icon: 'pencil', onSelect: onEdit },
            ...(onMove ? [{ label: 'Move to another form', icon: 'folder' as const, onSelect: onMove }] : []),
            { label: 'Delete scenario', icon: 'trash', tone: 'danger', onSelect: onDelete },
          ]}
        />
      </div>
      <div className={styles.actions}>
        <Button size="md" icon="play" iconSize="tiny" className={styles.cardButton} onClick={onRun}>
          Run
        </Button>
        <Button variant="secondary" size="md" icon="swap" className={styles.addEdgeCase} onClick={onAddEdgeCase}>
          Add edge case
        </Button>
      </div>
      {scenario.edgeCases.length > 0 && (
        <EdgeCaseSection
          scenario={scenario}
          expanded={edgeCasesExpanded}
          onToggle={onToggleEdgeCases}
          renderActions={(edgeCase) => (
            <>
              <button
                type="button"
                className={styles.edgeCaseRun}
                aria-label={`Run with ${edgeCase.name}`}
                title={isOrphaned(scenario, edgeCase) ? `${edgeCase.label} isn't in this scenario anymore` : undefined}
                disabled={isOrphaned(scenario, edgeCase)}
                onClick={() => onRunEdgeCase(edgeCase)}
              >
                <Icon name="play" size="tiny" />
              </button>
              <ActionMenu
              className={styles.edgeCaseMenu}
              label={`More actions for ${edgeCase.name}`}
              actions={[
                { label: 'Edit edge case', icon: 'pencil', onSelect: () => onEditEdgeCase(edgeCase) },
                { label: 'Delete edge case', icon: 'trash', tone: 'danger', onSelect: () => onDeleteEdgeCase(edgeCase) },
              ]}
              />
            </>
          )}
        />
      )}
    </li>
  )
}
