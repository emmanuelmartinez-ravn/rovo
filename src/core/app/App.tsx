import { Header } from './Header.tsx'
import styles from './App.module.css'

function App() {
  return (
    <div className={styles.root}>
      <Header />
      <main className={styles.content} />
    </div>
  )
}

export default App
