import { scenarioCount, type Folder } from '@/core/scenarios/folder.ts'
import { ActionMenu } from '@/shared/ui/ActionMenu.tsx'
import { Icon } from '@/shared/ui/Icon.tsx'
import styles from './FormCard.module.css'

type FormCardProps = {
  folder: Folder
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
}

/** One form on the forms list: opens its scenarios, with rename and delete in its menu. */
export function FormCard({ folder, onOpen, onRename, onDelete }: FormCardProps) {
  return (
    <li className={styles.root}>
      <button type="button" className={styles.open} onClick={onOpen}>
        <span className={styles.text}>
          <span className={styles.title}>{folder.name}</span>
          <span className={styles.meta}>{scenarioCount(folder)}</span>
        </span>
        <Icon name="chevronRight" />
      </button>
      <ActionMenu
        className={styles.menu}
        label={`More actions for ${folder.name}`}
        actions={[
          { label: 'Rename form', icon: 'pencil', onSelect: onRename },
          { label: 'Delete form', icon: 'trash', tone: 'danger', onSelect: onDelete },
        ]}
      />
    </li>
  )
}
