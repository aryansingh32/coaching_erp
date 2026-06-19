"use client"

import { useState } from "react"
import { proxyErpList, proxyMoodleCall } from "@/lib/api/services"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function ProxyExplorerPage() {
  const [doctype, setDoctype] = useState('Student')
  const [wsFunction, setWsFunction] = useState('core_course_get_courses')
  const [result, setResult] = useState<string>('')

  const queryErp = async () => {
    try {
      const data = await proxyErpList(doctype)
      setResult(JSON.stringify(data, null, 2))
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || 'ERP query failed')
    }
  }

  const queryMoodle = async () => {
    try {
      const data = await proxyMoodleCall(wsFunction, {})
      setResult(JSON.stringify(data, null, 2))
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || 'Moodle call failed')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Explorer</h1>
        <p className="text-muted-foreground">Secure passthrough to ERPNext (1000+ doctypes) and Moodle Web Services.</p>
      </div>
      <Tabs defaultValue="erp">
        <TabsList>
          <TabsTrigger value="erp">ERPNext</TabsTrigger>
          <TabsTrigger value="moodle">Moodle</TabsTrigger>
        </TabsList>
        <TabsContent value="erp">
          <Card className="bg-platform-surface border-platform-border">
            <CardHeader><CardTitle>List ERPNext Documents</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Input value={doctype} onChange={(e) => setDoctype(e.target.value)} placeholder="DocType e.g. Student" />
              <Button onClick={queryErp}>Query</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="moodle">
          <Card className="bg-platform-surface border-platform-border">
            <CardHeader><CardTitle>Moodle Web Service</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Input value={wsFunction} onChange={(e) => setWsFunction(e.target.value)} placeholder="wsFunction" />
              <Button onClick={queryMoodle}>Call</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {result && (
        <Card className="bg-platform-surface border-platform-border">
          <CardContent className="p-4">
            <pre className="text-xs overflow-auto max-h-96">{result}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
