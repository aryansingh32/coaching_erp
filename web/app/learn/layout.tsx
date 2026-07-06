"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Home, BookOpen, Clock, User, LogOut, ClipboardList, CalendarDays,
  IndianRupee, Video, Menu, X
} from "lucide-react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { useAuthStore } from "@/lib/stores/auth-store"
import { useFeatureEnabled } from "@/lib/features"
import { NovuNotificationBell } from "@/components/notifications/novu-bell"
import type { LucideIcon } from "lucide-react"

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  feature?: 'online_tests' | 'recordings'
}

const studentNavItems: NavItem[] = [
  { href: '/learn', label: 'Home', icon: Home },
  { href: '/learn/courses', label: 'Courses', icon: BookOpen },
  { href: '/learn/schedule', label: 'Schedule', icon: CalendarDays },
  { href: '/learn/tests', label: 'Tests', icon: ClipboardList, feature: 'online_tests' as const },
  { href: '/learn/timeline', label: 'Timeline', icon: Clock },
  { href: '/learn/recordings', label: 'Recordings', icon: Video, feature: 'recordings' as const },
  { href: '/learn/profile', label: 'Profile', icon: User },
]

const parentNavItems: NavItem[] = [
  { href: '/learn', label: 'Home', icon: Home },
  { href: '/learn/attendance', label: 'Attendance', icon: CalendarDays },
  { href: '/learn/profile', label: 'Fees & Profile', icon: IndianRupee },
  { href: '/learn/timeline', label: 'Timeline', icon: Clock },
]

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { displayName, logout, role } = useAuthStore()
  const onlineTestsEnabled = useFeatureEnabled('online_tests')
  const recordingsEnabled = useFeatureEnabled('recordings')
  const notificationsEnabled = useFeatureEnabled('notifications')
  
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const baseNav = role === 'parent' ? parentNavItems : studentNavItems
  const navItems = baseNav.filter((item) => {
    if (item.feature === 'online_tests') return onlineTestsEnabled
    if (item.feature === 'recordings') return recordingsEnabled
    return true
  })

  const primaryItems = navItems.slice(0, 3)
  const moreItems = navItems.slice(3)
  const portalLabel = role === 'parent' ? 'Parent Portal' : 'Student Portal'

  return (
    <AuthGuard allowedRoles={['student', 'parent']}>
      <div className="dark min-h-screen bg-background text-foreground flex flex-col md:flex-row">
        {/* Mobile Nav */}
        <nav className="md:hidden fixed bottom-0 w-full bg-card border-t border-border flex justify-around items-center h-16 z-50">
          {primaryItems.map((item) => (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className={`flex flex-col items-center transition-colors ${
                pathname === item.href || (item.href !== '/learn' && pathname.startsWith(item.href))
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          ))}
          {moreItems.length > 0 && (
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className={`flex flex-col items-center transition-colors ${
                moreMenuOpen ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              }`}
            >
              <Menu className="w-5 h-5 mb-1" />
              <span className="text-[10px]">More</span>
            </button>
          )}
        </nav>

        {/* Mobile More Drawer */}
        {moreMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex flex-col justify-end bg-black/50">
            <div className="bg-card w-full rounded-t-xl p-4 mb-16 animate-in slide-in-from-bottom-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">More Menu</h3>
                <button onClick={() => setMoreMenuOpen(false)} className="p-2 text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {moreItems.map((item) => (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    onClick={() => setMoreMenuOpen(false)}
                    className="flex flex-col items-center p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                  >
                    <item.icon className="w-6 h-6 mb-2 text-primary" />
                    <span className="text-xs text-center">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border min-h-screen p-6">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground">
              {displayName?.[0] ?? 'S'}
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block">{portalLabel}</span>
              <span className="text-xs text-muted-foreground">{displayName}</span>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  pathname === item.href || (item.href !== '/learn' && pathname.startsWith(item.href))
                    ? 'text-foreground bg-accent/50'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-3 py-2 rounded-md text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors mt-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </aside>

        <main className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto">
          {notificationsEnabled && (
            <div className="max-w-5xl mx-auto flex justify-end mb-4">
              <NovuNotificationBell />
            </div>
          )}
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
