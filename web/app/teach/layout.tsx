"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LayoutDashboard, Users, ClipboardCheck, LogOut, Video } from "lucide-react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useFeatureEnabled } from "@/lib/features"

const navItems = [
  { href: '/teach', label: "Today's Schedule", icon: LayoutDashboard },
  { href: '/teach/batches', label: 'My Batches', icon: Users },
  { href: '/teach/attendance', label: 'Mark Attendance', icon: ClipboardCheck },
  { href: '/teach/live-class', label: 'Live Classes', icon: Video, feature: 'live_classes' as const },
]

export default function TeachLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { displayName, logout } = useAuthStore()
  const liveClassesEnabled = useFeatureEnabled('live_classes')

  const visibleNav = navItems.filter((item) => !item.feature || (item.feature === 'live_classes' && liveClassesEnabled))

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <AuthGuard allowedRoles={['instructor']}>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
        <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50">
          {visibleNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center text-slate-500 hover:text-blue-600 transition-colors"
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-[10px]">{item.label.split(' ')[0]}</span>
            </Link>
          ))}
        </nav>

        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white">
              {displayName?.[0] ?? 'T'}
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-800 block">Educator</span>
              <span className="text-xs text-slate-500">{displayName}</span>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 rounded-md text-red-600 hover:bg-red-50 transition-colors mt-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </aside>

        <main className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto">
          <div className="max-w-5xl mx-auto">{children}</div>
        </main>
      </div>
    </AuthGuard>
  )
}
