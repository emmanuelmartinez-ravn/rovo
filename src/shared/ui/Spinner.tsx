const sizeClasses = {
  sm: 'size-4 border-2',
  md: 'size-6 border-[3px]',
} as const

type SpinnerProps = {
  size?: keyof typeof sizeClasses
  /** Announced to screen readers while the spinner is shown. */
  label?: string
}

export function Spinner({ size = 'sm', label = 'Loading' }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center">
      <span
        aria-hidden="true"
        className={`${sizeClasses[size]} inline-block animate-spin rounded-full border-accent-subtle border-t-accent motion-reduce:animate-pulse motion-reduce:border-accent`}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
