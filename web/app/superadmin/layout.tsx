"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Building2, Activity, LogOut, Menu,
  ScrollText, Network, BarChart3, Shield, ToggleLeft,
} from "lucide-react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/lib/stores/auth-store"

const navigation = [
  { name: "Command Center", href: "/superadmin/dashboard", icon: LayoutDashboard },
  { name: "Tenants", href: "/superadmin/tenants", icon: Building2 },
  { name: "Plans & Features", href: "/superadmin/plans", icon: ToggleLeft },
  { name: "Analytics", href: "/superadmin/analytics", icon: BarChart3 },
  { name: "Audit Logs", href: "/superadmin/audit-logs", icon: ScrollText },
  // Notifications hidden until gateway Novu logs module exists (currently mock data)
  { name: "API Proxy", href: "/superadmin/proxy", icon: Network },
  { name: "System Health", href: "/superadmin/health", icon: Activity },
  { name: "Security", href: "/superadmin/security", icon: Shield },
]

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)

  return (
    <AuthGuard allowedRoles={['super_admin', 'super-admin']}>
      <div className="min-h-screen bg-platform-bg text-platform-text flex">
        <aside className="hidden md:flex flex-col w-64 bg-platform-surface border-r border-platform-border sticky top-0 h-screen">
          <div className="p-6 border-b border-platform-border">
            <span className="font-bold text-lg text-platform-accent">CoachingOS</span>
            <p className="text-xs text-muted-foreground mt-1">Platform Operations</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  pathname.startsWith(item.href)
                    ? "bg-platform-accent/20 text-platform-accent font-medium"
                    : "text-muted-foreground hover:bg-platform-elevated"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-platform-border">
            <Button variant="ghost" className="w-full justify-start" onClick={() => { logout(); router.push('/login') }}>
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </div>
        </aside>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </AuthGuard>
  )
}
