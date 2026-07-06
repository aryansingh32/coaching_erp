import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  variant?: 'default' | 'success' | 'warning' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  animated?: boolean
}

const variantClass = {
  default: 'bg-primary',
  success: 'bg-green-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
}

const sizeClass = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
}

function Progress({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  showValue = false,
  animated = false,
  className,
  ...props
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('space-y-1', className)} {...props}>
      <div className={cn('w-full rounded-full bg-muted overflow-hidden', sizeClass[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            variantClass[variant],
            animated && 'animate-pulse',
          )}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showValue && (
        <p className="text-xs text-muted-foreground text-right">{Math.round(pct)}%</p>
      )}
    </div>
  )
}

export { Progress }
