import * as React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export interface KPICardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  subLabel?: string
  trend?: number   // positive = up, negative = down, 0/undefined = neutral
  icon?: React.ReactNode
  variant?: 'default' | 'platform' | 'success' | 'warning' | 'danger'
  loading?: boolean
}

const variantClasses = {
  default: 'bg-card border-border text-card-foreground',
  platform: 'bg-platform-surface border-platform-border text-platform-text',
  success: 'bg-green-500/10 border-green-500/20 text-foreground',
  warning: 'bg-amber-500/10 border-amber-500/20 text-foreground',
  danger: 'bg-red-500/10 border-red-500/20 text-foreground',
}

function KPICard({
  label,
  value,
  subLabel,
  trend,
  icon,
  variant = 'default',
  loading = false,
  className,
  ...props
}: KPICardProps) {
  const TrendIcon =
    trend === undefined || trend === 0
      ? Minus
      : trend > 0
        ? TrendingUp
        : TrendingDown

  const trendColor =
    trend === undefined || trend === 0
      ? 'text-muted-foreground'
      : trend > 0
        ? 'text-green-500'
        : 'text-red-500'

  return (
    <div
      className={cn(
        'rounded-xl border p-5 flex flex-col gap-3 transition-shadow hover:shadow-md',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        {icon && <span className="opacity-60">{icon}</span>}
      </div>

      {loading ? (
        <div className="animate-pulse">
          <div className="h-8 bg-muted/50 rounded w-24 mb-2" />
          <div className="h-4 bg-muted/30 rounded w-16" />
        </div>
      ) : (
        <>
          <span className="text-3xl font-bold tracking-tight">{value}</span>
          {(subLabel !== undefined || trend !== undefined) && (
            <div className="flex items-center gap-1.5">
              <TrendIcon className={cn('w-4 h-4', trendColor)} />
              {subLabel && (
                <span className={cn('text-sm', trendColor)}>{subLabel}</span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export { KPICard }
