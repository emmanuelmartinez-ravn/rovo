import { useId, type ReactNode } from 'react'
import { isOrphaned, type EdgeCase, type Scenario } from '@/core/scenarios/scenario.ts'
import { Icon } from '@/shared/ui/Icon.tsx'
import styles from './EdgeCaseSection.module.css'

type EdgeCaseSectionProps = {
  scenario: Scenario
  expanded: boolean
  onToggle: () => void
  /** Actions shown at the end of each edge case's row (e.g. its ⋮ menu). */
  renderActions?: (edgeCase: EdgeCase) => ReactNode
}

/** A scenario's saved edge cases, behind a "Saved edge cases N" disclosure. */
export function EdgeCaseSection({ scenario, expanded, onToggle, renderActions }: EdgeCaseSectionProps) {
  const listId = useId()
  const count = scenario.edgeCases.length

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={onToggle}
      >
        <span className={styles.toggleLabel}>
          <Icon name="swap" size="xs" />
          Saved edge cases
          <span className={styles.count}>{count}</span>
        </span>
        <span className={styles.chevron}>
          <Icon name="chevronDown" />
        </span>
      </button>
      {expanded && (
        <ul id={listId} className={styles.list}>
          {scenario.edgeCases.map((edgeCase) => (
            <li key={edgeCase.id} className={styles.item}>
              <div className={styles.itemText}>
                <span className={styles.itemName}>{edgeCase.name}</span>
                <span className={styles.itemMeta} title={`${edgeCase.label} → ${edgeCase.value}`}>
                  {edgeCase.label} → {edgeCase.value === '' ? '(empty)' : edgeCase.value}
                </span>
                {isOrphaned(scenario, edgeCase) && (
                  <span className={styles.itemWarning}>{edgeCase.label} isn't in this scenario anymore</span>
                )}
              </div>
              {renderActions?.(edgeCase)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
