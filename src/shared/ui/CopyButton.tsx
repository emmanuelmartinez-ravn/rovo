import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from './Button.tsx'
import { VisuallyHidden } from './VisuallyHidden.tsx'

/** How long the button says it copied before going back to its label. */
const COPIED_MS = 2000

type CopyButtonProps = {
  /** What lands on the clipboard. */
  text: string
  children: ReactNode
  /** Shown, and announced, for a moment after a copy. */
  copiedLabel?: string
  variant?: 'primary' | 'secondary'
  size?: 'lg' | 'md' | 'sm'
  onCopied?: () => void
  /** Writing to the clipboard failed; the button keeps its label. */
  onFailed?: (error: unknown) => void
}

/** Copies `text` to the clipboard, then reads `copiedLabel` with a check for two seconds. */
export function CopyButton({
  text,
  children,
  copiedLabel = 'Copied',
  variant = 'secondary',
  size,
  onCopied,
  onFailed,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function copy() {
    navigator.clipboard.writeText(text).then(
      () => {
        window.clearTimeout(timer.current)
        setCopied(true)
        timer.current = window.setTimeout(() => setCopied(false), COPIED_MS)
        onCopied?.()
      },
      (error: unknown) => {
        window.clearTimeout(timer.current)
        setCopied(false)
        onFailed?.(error)
      },
    )
  }

  return (
    <>
      <Button variant={variant} size={size} icon={copied ? 'check' : 'copy'} iconSize="xs" onClick={copy}>
        {copied ? copiedLabel : children}
      </Button>
      <VisuallyHidden>
        <span role="status">{copied ? copiedLabel : ''}</span>
      </VisuallyHidden>
    </>
  )
}
