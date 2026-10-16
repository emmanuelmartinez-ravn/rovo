import { CurrentTabDomain } from '@/features/current-tab-domain/CurrentTabDomain.tsx'
import styles from './App.module.css'

function App() {
  return (
    <main className={styles.root}>
      <h1>Rovo</h1>
      <CurrentTabDomain />
    </main>
  )
}

export default App
