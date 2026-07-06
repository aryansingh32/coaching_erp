"use client"

import { useState } from "react"
import { MetabaseEmbed } from "@/components/analytics/metabase-embed"
import { BarChart3, LayoutDashboard, DollarSign, Users, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

const DASHBOARDS = [
  { id: '1', name: 'Institute Overview', icon: LayoutDashboard, desc: 'High-level KPIs and metrics' },
  { id: '2', name: 'Financial Reports', icon: DollarSign, desc: 'Revenue, outstanding fees, collection' },
  { id: '3', name: 'Student Attendance', icon: Users, desc: 'Batch-wise attendance trends' },
  { id: '4', name: 'Batch Schedules', icon: Calendar, desc: 'Upcoming class schedules and load' },
]

export default function ReportsPage() {
  const [activeDashboardId, setActiveDashboardId] = useState(DASHBOARDS[0].id)

  return (
    <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            Analytics &amp; Reports
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Visualize your institute's performance and generate custom reports.
          </p>
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[600px]">
        {/* Catalog Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Dashboards Catalog</h3>
          <div className="flex flex-col gap-1">
            {DASHBOARDS.map(dash => {
              const Icon = dash.icon
              const isActive = activeDashboardId === dash.id
              return (
                <button
                  key={dash.id}
                  onClick={() => setActiveDashboardId(dash.id)}
                  className={cn(
                    "flex items-start gap-3 w-full text-left px-3 py-2.5 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm leading-tight">{dash.name}</span>
                    <span className="text-xs opacity-70 mt-1">{dash.desc}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Dashboard Viewer */}
        <div className="flex-1 bg-card rounded-xl border shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-muted/20">
            <h2 className="font-semibold">{DASHBOARDS.find(d => d.id === activeDashboardId)?.name}</h2>
          </div>
          <div className="flex-1 p-4">
            <MetabaseEmbed dashboardId={activeDashboardId} />
          </div>
        </div>
      </div>
    </div>
  )
}

