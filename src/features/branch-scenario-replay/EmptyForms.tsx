import { Button } from '@/shared/ui/Button.tsx'
import { Icon } from '@/shared/ui/Icon.tsx'
import card from './EmptyScenarios.module.css'
import styles from './EmptyForms.module.css'

/** The card shown until this domain has a form. */
export function EmptyForms({ onNew }: { onNew: () => void }) {
  return (
    <div className={card.card}>
      <span className={styles.icon}>
        <Icon name="folder" size="dialog" />
      </span>
      <div className={card.text}>
        <h3 className={card.title}>No forms on this site yet</h3>
        <p className={card.hint}>
          Add a form for each one you test here, like Signup or Checkout. Its scenarios are the ways you
          fill it in.
        </p>
      </div>
      <Button icon="plus" onClick={onNew}>
        New form
      </Button>
    </div>
  )
}
