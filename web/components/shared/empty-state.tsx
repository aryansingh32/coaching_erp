import { Inbox } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  description?: string
}

export function EmptyState({
  title = 'No data yet',
  description = 'There is nothing to display. Data will appear once it is available from the backend.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <Inbox className="h-10 w-10 text-muted-foreground" />
      <h4 className="font-medium">{title}</h4>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  )
}
