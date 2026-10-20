import type { Scenario } from '@/core/scenarios/scenario.ts'
import { ActionMenu } from '@/shared/ui/ActionMenu.tsx'
import { EdgeCaseSection } from './EdgeCaseSection.tsx'
import styles from './ScenarioCard.module.css'

type ScenarioCardProps = {
  scenario: Scenario
  /** Whether the "Saved edge cases" section is open. */
  edgeCasesExpanded: boolean
  onToggleEdgeCases: () => void
  onEdit: () => void
  onDelete: () => void
}

export function ScenarioCard({ scenario, edgeCasesExpanded, onToggleEdgeCases, onEdit, onDelete }: ScenarioCardProps) {
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
      {scenario.edgeCases.length > 0 && (
        <EdgeCaseSection scenario={scenario} expanded={edgeCasesExpanded} onToggle={onToggleEdgeCases} />
      )}
    </li>
  )
}
