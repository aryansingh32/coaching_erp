"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, BookOpen, Clock, User, LogOut } from "lucide-react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { useAuthStore } from "@/lib/stores/auth-store"

const navItems = [
  { href: '/learn', label: 'Home', icon: Home },
  { href: '/learn/courses', label: 'Courses', icon: BookOpen },
  { href: '/learn/timeline', label: 'Timeline', icon: Clock },
  { href: '/learn/profile', label: 'Profile', icon: User },
]

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { displayName, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <AuthGuard allowedRoles={['student', 'parent']}>
      <div className="dark min-h-screen bg-background text-foreground flex flex-col md:flex-row">
        <nav className="md:hidden fixed bottom-0 w-full bg-card border-t border-border flex justify-around items-center h-16 z-50">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          ))}
        </nav>

        <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border min-h-screen p-6">
          <div className="flex items-center space-x-3 mb-10">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground">
              {displayName?.[0] ?? 'S'}
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight block">Student Portal</span>
              <span className="text-xs text-muted-foreground">{displayName}</span>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
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
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
