import type { ReactNode } from 'react'
import type { RunEntry, RunFailure } from '@/core/run/run.ts'
import type { Run, RunState, StepStatus } from '@/core/run/useScenarioRun.ts'
import { Button } from '@/shared/ui/Button.tsx'
import { Notice } from '@/shared/ui/Notice.tsx'
import { RunStatusIcon } from './RunStatusIcon.tsx'
import styles from './RunView.module.css'

type RunViewProps = {
  state: Exclude<RunState, { status: 'idle' }>
  onStop: () => void
  onRunAgain: () => void
  onEditScenario: () => void
  /** Opens the edge-case editor for the run's scenario. */
  onAddEdgeCase: () => void
  onBack: () => void
}

/** A run's progress, then its outcome (mockup screens 4, 6 and 7). */
export function RunView({ state, onStop, onRunAgain, onEditScenario, onAddEdgeCase, onBack }: RunViewProps) {
  const back = (
    <button type="button" className={styles.textAction} onClick={onBack}>
      Back to scenarios
    </button>
  )

  if (state.status === 'starting') {
    return (
      <section className={styles.root}>
        <div role="status" className={`${styles.header} ${styles.running}`}>
          <p className={styles.body}>Starting the run…</p>
        </div>
      </section>
    )
  }
  if (state.status === 'unavailable') {
    return (
      <section className={styles.root}>
        <Notice>
          {state.reason === 'busy'
            ? 'Another run is already going in this tab. Wait for it to finish, then run again.'
            : "Rovo can't run on this page."}
        </Notice>
        <div className={styles.actions}>{back}</div>
      </section>
    )
  }

  const run = state
  return (
    <section className={styles.root}>
      <RunHeader run={run} />
      <ol className={styles.steps}>
        {run.entries.map((entry, index) => (
          <StepRow key={index} entry={entry} status={run.steps[index] ?? 'pending'} failure={failureAt(run, index)} />
        ))}
      </ol>
      {run.status === 'failed' && run.failure?.failure.kind === 'notFound' && (
        <p className={styles.hint}>
          Fields are found by the label shown on the form. Check how this field is labeled on the page, then update the
          entry.
        </p>
      )}
      <div className={styles.actions}>
        {run.status === 'running' && (
          <Button variant="secondary" icon="stop" iconSize="tiny" disabled={run.stopRequested} onClick={onStop}>
            Stop run
          </Button>
        )}
        {run.status === 'finished' && (
          <>
            <Button icon="refresh" iconSize="xs" onClick={onRunAgain}>
              Run again
            </Button>
            <Button variant="secondary" className={styles.compactButton} onClick={onAddEdgeCase}>
              {run.edgeCase ? 'Try another edge case' : 'Add edge case'}
            </Button>
            {back}
          </>
        )}
        {run.status === 'failed' && (
          <>
            <Button icon="pencil" iconSize="xs" onClick={onEditScenario}>
              Edit scenario
            </Button>
            <Button variant="secondary" onClick={onRunAgain}>
              Run again
            </Button>
          </>
        )}
        {(run.status === 'stopped' || run.status === 'interrupted') && (
          <>
            <Button icon="refresh" iconSize="xs" onClick={onRunAgain}>
              Run again
            </Button>
            {back}
          </>
        )}
      </div>
    </section>
  )
}

function failureAt(run: Run, index: number): RunFailure | undefined {
  return run.failure?.index === index ? run.failure.failure : undefined
}

function RunHeader({ run }: { run: Run }) {
  const total = run.entries.length
  const filled = run.steps.filter((step) => step === 'filled').length
  const name = run.scenario.name

  if (run.status === 'running') {
    const active = run.steps.indexOf('active')
    const activeEntry = run.entries[active]
    return (
      <div role="status" aria-live="polite" className={`${styles.header} ${styles.running}`}>
        <div className={styles.runningTop}>
          <div className={styles.runningTitle}>
            <span className={styles.kicker}>Running</span>
            <h2 className={styles.title}>{name}</h2>
          </div>
          <span className={styles.count}>
            {Math.min(filled + 1, total)} / {total}
          </span>
        </div>
        <progress className={styles.progress} value={filled} max={total} aria-hidden="true" />
        <p className={styles.body}>
          {run.stopRequested
            ? 'Stopping after this field…'
            : activeEntry
              ? `Waiting for “${activeEntry.label}” to appear on the page…`
              : 'Starting…'}
        </p>
      </div>
    )
  }
  if (run.status === 'finished') {
    return (
      <div role="status" className={`${styles.header} ${styles.success}`}>
        <RunStatusIcon status="filled" large />
        <div className={styles.headerText}>
          <h2 className={styles.title}>Run complete</h2>
          <p className={styles.body}>
            {name} · {filled} of {total} entries filled
            {run.edgeCase && ` · edge case “${run.edgeCase.name}” (saved)`}
          </p>
        </div>
      </div>
    )
  }
  if (run.status === 'failed' && run.failure) {
    const entry = run.entries[run.failure.index]
    return (
      <div role="alert" className={`${styles.header} ${styles.danger}`}>
        <RunStatusIcon status="alert" large />
        <div className={styles.headerText}>
          <h2 className={styles.title}>
            Stopped at entry {run.failure.index + 1} of {total}
          </h2>
          <p className={styles.body}>
            {entry && failureSentence(entry, run.failure.failure)} {name}.
          </p>
        </div>
      </div>
    )
  }
  if (run.status === 'interrupted') {
    return (
      <div role="alert" className={`${styles.header} ${styles.danger}`}>
        <RunStatusIcon status="alert" large />
        <div className={styles.headerText}>
          <h2 className={styles.title}>Run interrupted</h2>
          <p className={styles.body}>
            The page changed during the run, after {filled} of {total} entries. {name}.
          </p>
        </div>
      </div>
    )
  }
  return (
    <div role="status" className={`${styles.header} ${styles.neutral}`}>
      <div className={styles.headerText}>
        <h2 className={styles.title}>Run stopped</h2>
        <p className={styles.body}>
          Stopped before entry {(run.stoppedAt ?? filled) + 1} of {total}. {name}.
        </p>
      </div>
    </div>
  )
}

function failureSentence(entry: RunEntry, failure: RunFailure): ReactNode {
  const label = <strong>{entry.label}</strong>
  switch (failure.kind) {
    case 'notFound':
      return <>No field labeled {label} was found on the page.</>
    case 'noOption':
      return (
        <>
          {label} has no option <strong>{entry.value}</strong>
          {failure.options.length > 0 && <> (it offers {failure.options.filter(Boolean).join(', ')})</>}.
        </>
      )
    case 'disabled':
      return <>The field {label} stayed disabled, so it couldn't be filled.</>
    case 'checkboxValue':
      return <>{label} is a checkbox: use yes or no as its value.</>
  }
}

const failureNotes: Record<RunFailure['kind'], string> = {
  notFound: 'Not filled — label not found',
  noOption: 'Not filled — option not found',
  disabled: 'Not filled — field disabled',
  checkboxValue: 'Not filled — use yes or no',
}

function StepRow({ entry, status, failure }: { entry: RunEntry; status: StepStatus; failure?: RunFailure }) {
  const swapped = entry.scenarioValue !== undefined
  const className = [
    styles.step,
    status === 'active' && styles.stepActive,
    status === 'pending' && styles.stepPending,
    swapped && styles.stepSwapped,
    status === 'failed' && styles.stepFailed,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <li className={className}>
      <RunStatusIcon status={status} />
      <div className={styles.stepText}>
        <div className={styles.stepTop}>
          <span className={styles.stepLabel}>{entry.label}</span>
          {swapped && <span className={styles.tag}>Edge case</span>}
        </div>
        <span className={styles.stepValue}>{entry.value === '' ? '(empty)' : entry.value}</span>
        {swapped && (
          <span className={styles.stepNote}>
            Scenario value: <code>{entry.scenarioValue}</code>
          </span>
        )}
        {failure && <span className={styles.stepNote}>{failureNotes[failure.kind]}</span>}
      </div>
    </li>
  )
}
