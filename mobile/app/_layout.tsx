import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/auth-store'

const queryClient = new QueryClient()

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role, hydrate } = useAuthStore()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    const inAuth = segments[0] === '(auth)'

    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/login')
      return
    }

    if (isAuthenticated && inAuth) {
      if (role === 'instructor') router.replace('/(teacher)/home')
      else router.replace('/(student)/home')
    }
  }, [isAuthenticated, role, segments, router])

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthGate>
    </QueryClientProvider>
  )
}
