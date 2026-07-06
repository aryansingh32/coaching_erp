"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRecordManualPayment } from "@/lib/api/hooks"
import { toast } from "sonner"

interface CollectPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: string
  studentName?: string
  defaultAmount?: number
}

export function CollectPaymentModal({ isOpen, onClose, studentId, studentName, defaultAmount }: CollectPaymentModalProps) {
  const [amount, setAmount] = useState(defaultAmount?.toString() || "")
  const [mode, setMode] = useState<'Cash' | 'UPI' | 'Cheque'>('Cash')
  const [reference, setReference] = useState("")
  
  const recordPayment = useRecordManualPayment()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await recordPayment.mutateAsync({
        studentId,
        amount: parseFloat(amount),
        payment_mode: mode,
        reference_no: reference,
        date: new Date().toISOString().split('T')[0]
      })
      toast.success("Payment recorded successfully")
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Failed to record payment")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Collect Offline Payment</DialogTitle>
          <DialogDescription>
            Record a manual payment for {studentName || studentId}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input 
              type="number" 
              required 
              min="1" 
              step="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <Label>Payment Mode</Label>
            <Select value={mode} onValueChange={(v: any) => setMode(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(mode === 'UPI' || mode === 'Cheque') && (
            <div className="space-y-2">
              <Label>Reference No. / Cheque No.</Label>
              <Input 
                required 
                value={reference} 
                onChange={(e) => setReference(e.target.value)} 
                placeholder={mode === 'UPI' ? 'Transaction ID' : 'Cheque Number'}
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={recordPayment.isPending}>
              {recordPayment.isPending ? "Saving..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
