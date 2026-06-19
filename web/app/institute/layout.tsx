"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Bell, 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  CalendarDays,
  CreditCard,
  Video,
  BarChart3,
  Settings,
  Menu
} from "lucide-react"
import { useAuthStore } from "@/lib/stores/auth-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const sidebarNavigation = [
  { name: "Dashboard", href: "/institute/dashboard", icon: LayoutDashboard },
  { name: "Students", href: "/institute/students", icon: Users },
  { name: "Batches", href: "/institute/batches", icon: BookOpen },
  { name: "Attendance", href: "/institute/attendance", icon: CalendarDays },
  { name: "Finance", href: "/institute/finance", icon: CreditCard },
  { name: "Exams", href: "/institute/exams", icon: BookOpen },
  { name: "Communication", href: "/institute/communication", icon: BarChart3 },
  { name: "Settings", href: "/institute/settings", icon: Settings },
]

export default function InstituteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const branding = useAuthStore((state) => state.branding)

  return (
    <div className="min-h-screen bg-institute-bg-base flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-institute-bg-surface border-b border-institute-border">
        <div className="flex items-center space-x-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="w-8 h-8 rounded" />
          ) : (
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold">
              {branding?.instituteName?.[0] || 'I'}
            </div>
          )}
          <span className="font-semibold">{branding?.instituteName || 'Institute'}</span>
        </div>
        <Button variant="ghost" size="icon">
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-institute-bg-surface border-r border-institute-border sticky top-0 h-screen">
        <div className="p-6 border-b border-institute-border flex items-center space-x-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="w-10 h-10 rounded shadow-sm" />
          ) : (
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-lg shadow-glow">
              {branding?.instituteName?.[0] || 'I'}
            </div>
          )}
          <span className="font-bold text-lg text-institute-text-primary truncate">
            {branding?.instituteName || 'Institute Panel'}
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-4 px-3">
            Menu
          </div>
          {sidebarNavigation.map((item) => {
            const isActive = pathname.startsWith(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary-light text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="hidden md:flex h-16 bg-institute-bg-surface border-b border-institute-border items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-semibold capitalize text-institute-text-primary">
            {pathname.split('/').pop() || 'Dashboard'}
          </h2>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-institute-danger rounded-full" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium border border-primary/30">
              A
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
