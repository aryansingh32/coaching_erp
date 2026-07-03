"use client"

import { useState } from "react"
import {
  proxyErpList,
  proxyErpGet,
  proxyErpCreate,
  proxyErpUpdate,
  proxyErpMethod,
  proxyMoodleCall,
} from "@/lib/api/services"
import { GATEWAY_ENDPOINTS } from "@/lib/api/gateway-catalog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function ProxyExplorerPage() {
  const [doctype, setDoctype] = useState('Student')
  const [docName, setDocName] = useState('')
  const [filters, setFilters] = useState('')
  const [body, setBody] = useState('{}')
  const [method, setMethod] = useState('frappe.client.get_list')
  const [wsFunction, setWsFunction] = useState('core_course_get_courses')
  const [wsParams, setWsParams] = useState('{}')
  const [result, setResult] = useState('')

  const show = (data: unknown) => setResult(JSON.stringify(data, null, 2))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Explorer</h1>
        <p className="text-muted-foreground">
          Full ERPNext + Moodle passthrough — {GATEWAY_ENDPOINTS.length} typed BFF routes, 1000+ underlying OSS APIs.
        </p>
      </div>
      <Tabs defaultValue="erp-list">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="erp-list">ERP List</TabsTrigger>
          <TabsTrigger value="erp-get">ERP Get</TabsTrigger>
          <TabsTrigger value="erp-create">ERP Create</TabsTrigger>
          <TabsTrigger value="erp-update">ERP Update</TabsTrigger>
          <TabsTrigger value="erp-method">ERP Method</TabsTrigger>
          <TabsTrigger value="moodle">Moodle</TabsTrigger>
          <TabsTrigger value="catalog">Catalog</TabsTrigger>
        </TabsList>
        <TabsContent value="erp-list">
          <Card className="bg-platform-surface border-platform-border">
            <CardHeader><CardTitle>List ERPNext Documents</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Input value={doctype} onChange={(e) => setDoctype(e.target.value)} className="max-w-xs" />
              <Input value={filters} onChange={(e) => setFilters(e.target.value)} placeholder="filters" className="max-w-md" />
              <Button onClick={async () => {
                try { show(await proxyErpList(doctype, filters || undefined)) } catch (e: unknown) {
                  toast.error((e as { message?: string })?.message || 'Failed')
                }
              }}>Query</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="erp-get">
          <Card className="bg-platform-surface border-platform-border">
            <CardHeader><CardTitle>Get Document</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Input value={doctype} onChange={(e) => setDoctype(e.target.value)} />
              <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="name" />
              <Button onClick={async () => {
                try { show(await proxyErpGet(doctype, docName)) } catch (e: unknown) {
                  toast.error((e as { message?: string })?.message || 'Failed')
                }
              }}>Get</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="erp-create">
          <Card className="bg-platform-surface border-platform-border">
            <CardHeader><CardTitle>Create Document</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input value={doctype} onChange={(e) => setDoctype(e.target.value)} />
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
              <Button onClick={async () => {
                try { show(await proxyErpCreate(doctype, JSON.parse(body))) } catch (e: unknown) {
                  toast.error((e as { message?: string })?.message || 'Failed')
                }
              }}>Create</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="erp-update">
          <Card className="bg-platform-surface border-platform-border">
            <CardHeader><CardTitle>Update Document</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex gap-2">
                <Input value={doctype} onChange={(e) => setDoctype(e.target.value)} />
                <Input value={docName} onChange={(e) => setDocName(e.target.value)} />
              </div>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
              <Button onClick={async () => {
                try { show(await proxyErpUpdate(doctype, docName, JSON.parse(body))) } catch (e: unknown) {
                  toast.error((e as { message?: string })?.message || 'Failed')
                }
              }}>Update</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="erp-method">
          <Card className="bg-platform-surface border-platform-border">
            <CardHeader><CardTitle>ERPNext Method</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input value={method} onChange={(e) => setMethod(e.target.value)} />
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
              <Button onClick={async () => {
                try { show(await proxyErpMethod(method, JSON.parse(body))) } catch (e: unknown) {
                  toast.error((e as { message?: string })?.message || 'Failed')
                }
              }}>Call</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="moodle">
          <Card className="bg-platform-surface border-platform-border">
            <CardHeader><CardTitle>Moodle Web Service</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input value={wsFunction} onChange={(e) => setWsFunction(e.target.value)} />
              <Textarea value={wsParams} onChange={(e) => setWsParams(e.target.value)} rows={3} />
              <Button onClick={async () => {
                try { show(await proxyMoodleCall(wsFunction, JSON.parse(wsParams))) } catch (e: unknown) {
                  toast.error((e as { message?: string })?.message || 'Failed')
                }
              }}>Call</Button>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="catalog">
          <Card className="bg-platform-surface border-platform-border">
            <CardHeader><CardTitle>Gateway Catalog</CardTitle></CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto max-h-96">
                {GATEWAY_ENDPOINTS.map((e) => `${e.method.padEnd(6)} ${e.path}`).join('\n')}
              </pre>
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
