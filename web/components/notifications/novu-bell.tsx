'use client'

import dynamic from 'next/dynamic'
import { useAuthStore } from '@/lib/stores/auth-store'

const NovuProvider = dynamic(
  () => import('@novu/notification-center').then((m) => m.NovuProvider),
  { ssr: false }
)
const PopoverNotificationCenter = dynamic(
  () => import('@novu/notification-center').then((m) => m.PopoverNotificationCenter),
  { ssr: false }
)
const NotificationBell = dynamic(
  () => import('@novu/notification-center').then((m) => m.NotificationBell),
  { ssr: false }
)

const NOVU_APP_ID = process.env.NEXT_PUBLIC_NOVU_APP_ID || ''

export function NovuNotificationBell() {
  const erpId = useAuthStore((s) => s.erpId)

  if (!NOVU_APP_ID || !erpId) return null

  return (
    <NovuProvider subscriberId={erpId} applicationIdentifier={NOVU_APP_ID}>
      <PopoverNotificationCenter colorScheme="light">
        {({ unseenCount }) => (
          <NotificationBell unseenCount={unseenCount} />
        )}
      </PopoverNotificationCenter>
    </NovuProvider>
  )
}
