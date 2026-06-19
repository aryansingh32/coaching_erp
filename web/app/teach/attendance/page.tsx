"use client"

import { useState } from "react"
import { CheckCircle2, XCircle, Search, Save, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"

const MOCK_STUDENTS = [
  { id: "STU-001", name: "Alice Smith", rfidScanned: true },
  { id: "STU-002", name: "Bob Johnson", rfidScanned: false },
  { id: "STU-003", name: "Charlie Williams", rfidScanned: true },
  { id: "STU-004", name: "David Jones", rfidScanned: false },
  { id: "STU-005", name: "Eve Brown", rfidScanned: false },
  { id: "STU-006", name: "Faythe Davis", rfidScanned: false },
  { id: "STU-007", name: "Grace Miller", rfidScanned: true },
  { id: "STU-008", name: "Heidi Wilson", rfidScanned: false },
]

export default function TeachAttendancePage() {
  const { toast } = useToast()
  const [selectedBatch, setSelectedBatch] = useState("BCH-A-24")
  const [searchTerm, setSearchTerm] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  
  // Track manual overrides. Key is student ID, value is 'present' | 'absent' | null (unset)
  const [attendanceState, setAttendanceState] = useState<Record<string, 'present' | 'absent'>>({})

  const filteredStudents = MOCK_STUDENTS.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleAttendance = (id: string, status: 'present' | 'absent') => {
    setAttendanceState(prev => ({
      ...prev,
      [id]: status
    }))
  }

  const markAllPresent = () => {
    const newState: Record<string, 'present' | 'absent'> = {}
    MOCK_STUDENTS.forEach(s => {
      // Don't override if they already scanned RFID
      if (!s.rfidScanned) {
        newState[s.id] = 'present'
      }
    })
    setAttendanceState(prev => ({ ...prev, ...newState }))
  }

  const handleSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      toast({
        title: "Attendance Submitted",
        description: `Successfully recorded manual attendance for ${selectedBatch}.`,
      })
      setIsSaving(false)
    }, 1000)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Manual Attendance</h2>
        <p className="text-slate-500">Override or mark attendance for students who missed the RFID scanner.</p>
      </div>

      <Card className="border-slate-200 shadow-sm sticky top-0 z-10 bg-white/80 backdrop-blur-md">
        <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="w-full sm:w-1/3">
            <Select value={selectedBatch} onValueChange={setSelectedBatch}>
              <SelectTrigger>
                <SelectValue placeholder="Select Batch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BCH-A-24">BCH-A-24 (Physics)</SelectItem>
                <SelectItem value="BCH-B-24">BCH-B-24 (Chemistry)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full sm:w-1/3 flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search student..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shrink-0">
            {isSaving ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Submit Register</>}
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center px-2">
        <span className="text-sm font-medium text-slate-600">Showing {filteredStudents.length} students</span>
        <Button variant="ghost" size="sm" onClick={markAllPresent} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
          Mark Unscanned as Present
        </Button>
      </div>

      <div className="space-y-3">
        {filteredStudents.map((student) => {
          const isPresent = attendanceState[student.id] === 'present' || student.rfidScanned
          const isAbsent = attendanceState[student.id] === 'absent'

          return (
            <Card key={student.id} className={`overflow-hidden transition-colors ${isPresent ? 'bg-green-50/50 border-green-200' : isAbsent ? 'bg-red-50/50 border-red-200' : 'border-slate-200'}`}>
              <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900">{student.name}</h4>
                  <div className="flex items-center space-x-2 mt-1 text-xs">
                    <span className="font-mono text-slate-500">{student.id}</span>
                    {student.rfidScanned ? (
                      <span className="text-green-600 font-medium flex items-center">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Scanned via Gate
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center">
                        <AlertTriangle className="w-3 h-3 mr-1" /> No RFID Scan
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant={isPresent && !student.rfidScanned ? "default" : "outline"}
                    className={isPresent && !student.rfidScanned ? "bg-green-600 hover:bg-green-700" : "text-slate-600"}
                    onClick={() => toggleAttendance(student.id, 'present')}
                    disabled={student.rfidScanned}
                  >
                    <CheckCircle2 className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Present</span>
                  </Button>
                  <Button 
                    size="sm" 
                    variant={isAbsent ? "destructive" : "outline"}
                    className={!isAbsent ? "text-slate-600" : ""}
                    onClick={() => toggleAttendance(student.id, 'absent')}
                    disabled={student.rfidScanned}
                  >
                    <XCircle className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Absent</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
