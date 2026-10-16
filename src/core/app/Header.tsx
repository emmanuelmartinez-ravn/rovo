import { CurrentTabDomain } from '@/features/current-tab-domain/CurrentTabDomain.tsx'
import { Logo } from '@/shared/ui/Logo.tsx'
import styles from './Header.module.css'

export function Header() {
  return (
    <header className={styles.root}>
      <h1 className={styles.brand}>
        <Logo />
        Rovo
      </h1>
      <CurrentTabDomain />
    </header>
  )
}
