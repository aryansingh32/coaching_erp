'use client'

import { useAuthStore } from '@/lib/stores/auth-store'
import { useParentChildren } from '@/lib/api/hooks'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ParentChildSelector() {
  const role = useAuthStore((s) => s.role)
  const linkedStudents = useAuthStore((s) => s.linkedStudents)
  const activeStudentId = useAuthStore((s) => s.activeStudentId)
  const setActiveStudent = useAuthStore((s) => s.setActiveStudent)
  const { data: children } = useParentChildren()

  if (role !== 'parent') return null

  const students = children ?? linkedStudents.map((id) => ({ name: id, first_name: id }))

  if (!students.length) return null

  return (
    <div className="mb-6 p-4 rounded-lg bg-accent/30 border border-border">
      <label className="text-sm font-medium text-muted-foreground block mb-2">
        Viewing child
      </label>
      <Select value={activeStudentId ?? ''} onValueChange={setActiveStudent}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder="Select child" />
        </SelectTrigger>
        <SelectContent>
          {students.map((s: { name: string; first_name?: string; last_name?: string }) => (
            <SelectItem key={s.name} value={s.name}>
              {s.first_name} {s.last_name ?? ''} ({s.name})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function useActiveStudentId() {
  const role = useAuthStore((s) => s.role)
  const erpId = useAuthStore((s) => s.erpId)
  const activeStudentId = useAuthStore((s) => s.activeStudentId)
  return role === 'parent' ? (activeStudentId ?? erpId ?? '') : (erpId ?? '')
}
