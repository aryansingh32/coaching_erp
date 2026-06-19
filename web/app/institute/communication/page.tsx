"use client"

import { useState } from "react"
import { Send, MessageSquare, Mail, Smartphone, History, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const MOCK_HISTORY = [
  { id: "MSG-001", title: "Holiday Announcement", channel: "All", target: "All Students", date: "2024-03-20", status: "Sent", readRate: "85%" },
  { id: "MSG-002", title: "Fee Reminder", channel: "SMS", target: "Defaulters", date: "2024-03-18", status: "Sent", readRate: "92%" },
  { id: "MSG-003", title: "Class Cancellation", channel: "WhatsApp", target: "BCH-A-24", date: "2024-03-15", status: "Sent", readRate: "98%" },
]

export default function CommunicationPage() {
  const { toast } = useToast()
  const [isSending, setIsSending] = useState(false)
  const [form, setForm] = useState({ title: "", target: "", channel: "", message: "" })

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    setTimeout(() => {
      toast({
        title: "Announcement Sent!",
        description: `Successfully broadcasted to ${form.target} via ${form.channel}.`,
      })
      setIsSending(false)
      setForm({ title: "", target: "", channel: "", message: "" })
    }, 1500)
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold tracking-tight text-institute-text-primary">Communication & Notices</h3>
        <p className="text-muted-foreground">Broadcast announcements via SMS, Email, and WhatsApp.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">WhatsApp Delivery</CardTitle>
            <MessageSquare className="h-4 w-4 text-institute-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-institute-success">98.2%</div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Open Rate</CardTitle>
            <Mail className="h-4 w-4 text-institute-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-institute-primary">42.5%</div>
          </CardContent>
        </Card>
        <Card className="border-institute-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SMS Delivery</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95.1%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="compose">Compose Broadcast</TabsTrigger>
          <TabsTrigger value="history">Broadcast History</TabsTrigger>
        </TabsList>

        <TabsContent value="compose">
          <Card className="border-institute-border shadow-sm max-w-3xl">
            <CardHeader>
              <CardTitle>New Announcement</CardTitle>
              <CardDescription>Compose and send a message to specific batches or roles.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSend} className="space-y-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Subject / Title</label>
                  <Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Tomorrow's Class Cancelled" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Target Audience</label>
                    <Select value={form.target} onValueChange={v => setForm({...form, target: v})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All Students">All Students</SelectItem>
                        <SelectItem value="All Parents">All Parents</SelectItem>
                        <SelectItem value="Defaulters">Fee Defaulters</SelectItem>
                        <SelectItem value="BCH-A-24">Batch: BCH-A-24</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium">Channel</label>
                    <Select value={form.channel} onValueChange={v => setForm({...form, channel: v})} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select channel..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">Omnichannel (All)</SelectItem>
                        <SelectItem value="WhatsApp">WhatsApp Only</SelectItem>
                        <SelectItem value="Email">Email Only</SelectItem>
                        <SelectItem value="SMS">SMS Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium">Message Body</label>
                  <Textarea 
                    value={form.message} 
                    onChange={e => setForm({...form, message: e.target.value})} 
                    placeholder="Type your message here... (Supports variables like {{student_name}})" 
                    className="min-h-[150px]" 
                    required 
                  />
                </div>

                <Button type="submit" disabled={isSending} className="w-full sm:w-auto bg-institute-primary text-primary-foreground hover:bg-institute-primary/90">
                  {isSending ? "Sending via Novu..." : <><Send className="mr-2 h-4 w-4" /> Send Broadcast</>}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-institute-border shadow-sm">
            <CardHeader>
              <CardTitle>Broadcast Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Broadcast ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Read Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MOCK_HISTORY.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-xs">{log.id}</TableCell>
                        <TableCell className="font-medium">{log.title}</TableCell>
                        <TableCell>{log.target}</TableCell>
                        <TableCell>{log.channel}</TableCell>
                        <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-institute-success/10 text-institute-success">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">{log.readRate}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
