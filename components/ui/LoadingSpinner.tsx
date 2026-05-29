type LoadingSpinnerProps = {
  size?: number
  label?: string
  fullScreen?: boolean
  block?: boolean
  className?: string
}

export default function LoadingSpinner({
  size = 36,
  label = 'Loading...',
  fullScreen = false,
  block = false,
  className,
}: LoadingSpinnerProps) {
  const content = (
    <div className={`wavvy-spinner-wrap${className ? ` ${className}` : ''}`}>
      <div
        className="wavvy-spinner"
        style={{ width: size, height: size }}
        role="status"
        aria-label={label}
      />
      {label ? <p className="wavvy-spinner-label">{label}</p> : null}
    </div>
  )

  if (fullScreen) {
    return <div className="wavvy-loading-shell">{content}</div>
  }

  if (block) {
    return (
      <div className="wavvy-spinner-block">
        {content}
      </div>
    )
  }

  return content
}
