import type { EdgeCase, Scenario } from '@/core/scenarios/scenario.ts'
import { ActionMenu } from '@/shared/ui/ActionMenu.tsx'
import { Button } from '@/shared/ui/Button.tsx'
import { EdgeCaseSection } from './EdgeCaseSection.tsx'
import styles from './ScenarioCard.module.css'

type ScenarioCardProps = {
  scenario: Scenario
  /** Whether the "Saved edge cases" section is open. */
  edgeCasesExpanded: boolean
  onToggleEdgeCases: () => void
  onEdit: () => void
  onDelete: () => void
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
            { label: 'Delete scenario', icon: 'trash', tone: 'danger', onSelect: onDelete },
          ]}
        />
      </div>
      <div className={styles.actions}>
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
            <ActionMenu
              className={styles.edgeCaseMenu}
              label={`More actions for ${edgeCase.name}`}
              actions={[
                { label: 'Edit edge case', icon: 'pencil', onSelect: () => onEditEdgeCase(edgeCase) },
                { label: 'Delete edge case', icon: 'trash', tone: 'danger', onSelect: () => onDeleteEdgeCase(edgeCase) },
              ]}
            />
          )}
        />
      )}
    </li>
  )
}
