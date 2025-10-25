interface ProgressBarProps {
  current: number
  max: number
  label: string
  showPercentage?: boolean
}

export function ProgressBar({ current, max, label, showPercentage = true }: ProgressBarProps) {
  const percentage = Math.min((current / max) * 100, 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        {showPercentage && (
          <span className="font-medium text-foreground">
            {current} / {max}
          </span>
        )}
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
