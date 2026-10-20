import { ScenariosPanel } from '@/features/branch-scenario-replay/ScenariosPanel.tsx'
import { Header } from './Header.tsx'
import styles from './App.module.css'

function App() {
  return (
    <div className={styles.root}>
      <Header />
      <main className={styles.content}>
        <ScenariosPanel />
      </main>
    </div>
  )
}

export default App
