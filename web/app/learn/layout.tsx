import Link from "next/link"
import { Home, BookOpen, Clock, User, LogOut } from "lucide-react"

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  // We force the "dark" class on the outermost container to ensure the Student Portal 
  // is always in dark mode, gamified, and separate from the Institute Admin theme.
  return (
    <div className="dark min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      
      {/* Mobile Bottom Navigation (Visible only on small screens) */}
      <nav className="md:hidden fixed bottom-0 w-full bg-card border-t border-border flex justify-around items-center h-16 z-50">
        <Link href="/learn" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
          <Home className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Home</span>
        </Link>
        <Link href="/learn/courses" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Courses</span>
        </Link>
        <Link href="/learn/schedule" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
          <Clock className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Schedule</span>
        </Link>
        <Link href="/learn/profile" className="flex flex-col items-center text-muted-foreground hover:text-primary transition-colors">
          <User className="w-5 h-5 mb-1" />
          <span className="text-[10px]">Me</span>
        </Link>
      </nav>

      {/* Desktop Sidebar (Visible only on md+ screens) */}
      <aside className="hidden md:flex flex-col w-64 bg-card border-r border-border min-h-screen p-6">
        <div className="flex items-center space-x-3 mb-10">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">Student Portal</span>
        </div>

        <nav className="flex-1 space-y-2">
          <Link href="/learn" className="flex items-center space-x-3 px-3 py-2 rounded-md bg-accent text-accent-foreground font-medium">
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
          <Link href="/learn/courses" className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
            <BookOpen className="w-4 h-4" />
            <span>My Courses</span>
          </Link>
          <Link href="/learn/schedule" className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
            <Clock className="w-4 h-4" />
            <span>Schedule & Tests</span>
          </Link>
          <Link href="/learn/profile" className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors">
            <User className="w-4 h-4" />
            <span>Profile & Fees</span>
          </Link>
        </nav>

        <div className="pt-6 border-t border-border mt-auto">
          <Link href="/login" className="flex items-center space-x-3 px-3 py-2 rounded-md text-red-400 hover:text-red-300 hover:bg-red-950/30 transition-colors">
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
