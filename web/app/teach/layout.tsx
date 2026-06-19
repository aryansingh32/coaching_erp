import Link from "next/link"
import { LayoutDashboard, Users, Calendar, ClipboardCheck, LogOut } from "lucide-react"

export default function TeachLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col md:flex-row">
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around items-center h-16 z-50">
        <Link href="/teach" className="flex flex-col items-center text-slate-500 hover:text-blue-600 transition-colors">
          <LayoutDashboard className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Today</span>
        </Link>
        <Link href="/teach/batches" className="flex flex-col items-center text-slate-500 hover:text-blue-600 transition-colors">
          <Users className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Batches</span>
        </Link>
        <Link href="/teach/attendance" className="flex flex-col items-center text-slate-500 hover:text-blue-600 transition-colors">
          <ClipboardCheck className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Attendance</span>
        </Link>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 min-h-screen p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-10">
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center font-bold text-white">
            T
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">Educator</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/teach" className="flex items-center space-x-3 px-3 py-2 rounded-md bg-blue-50 text-blue-700 font-medium">
            <LayoutDashboard className="w-4 h-4" />
            <span>Today's Schedule</span>
          </Link>
          <Link href="/teach/batches" className="flex items-center space-x-3 px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors">
            <Users className="w-4 h-4" />
            <span>My Batches</span>
          </Link>
          <Link href="/teach/attendance" className="flex items-center space-x-3 px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors">
            <ClipboardCheck className="w-4 h-4" />
            <span>Mark Attendance</span>
          </Link>
          <Link href="/teach/calendar" className="flex items-center space-x-3 px-3 py-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors">
            <Calendar className="w-4 h-4" />
            <span>Calendar</span>
          </Link>
        </nav>

        <div className="pt-6 border-t border-slate-200 mt-auto">
          <Link href="/login" className="flex items-center space-x-3 px-3 py-2 rounded-md text-red-600 hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  )
}
