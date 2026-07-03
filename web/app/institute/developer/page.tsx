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
import { FeatureGate } from "@/components/shared/feature-gate"
import { GATEWAY_ENDPOINTS } from "@/lib/api/gateway-catalog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

export default function InstituteDeveloperPage() {
  const [doctype, setDoctype] = useState('Student')
  const [docName, setDocName] = useState('')
  const [filters, setFilters] = useState('')
  const [body, setBody] = useState('{}')
  const [method, setMethod] = useState('education.education.api.get_student_programs')
  const [wsFunction, setWsFunction] = useState('core_course_get_courses')
  const [wsParams, setWsParams] = useState('{}')
  const [result, setResult] = useState('')

  const show = (data: unknown) => setResult(JSON.stringify(data, null, 2))

  return (
    <FeatureGate feature="api_proxy">
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold">API Explorer</h3>
          <p className="text-muted-foreground">
            Access 1000+ ERPNext/Moodle APIs through the gateway proxy — never call OSS directly.
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
            <Card>
              <CardHeader><CardTitle>GET /proxy/erp/:doctype</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Input value={doctype} onChange={(e) => setDoctype(e.target.value)} placeholder="DocType" className="max-w-xs" />
                <Input value={filters} onChange={(e) => setFilters(e.target.value)} placeholder='filters JSON' className="max-w-md" />
                <Button onClick={async () => {
                  try { show(await proxyErpList(doctype, filters || undefined)) } catch (e: unknown) {
                    toast.error((e as { message?: string })?.message || 'Failed')
                  }
                }}>Query</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="erp-get">
            <Card>
              <CardHeader><CardTitle>GET /proxy/erp/:doctype/:name</CardTitle></CardHeader>
              <CardContent className="flex gap-2">
                <Input value={doctype} onChange={(e) => setDoctype(e.target.value)} placeholder="DocType" />
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
            <Card>
              <CardHeader><CardTitle>POST /proxy/erp/:doctype</CardTitle></CardHeader>
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
            <Card>
              <CardHeader><CardTitle>PUT /proxy/erp/:doctype/:name</CardTitle></CardHeader>
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
            <Card>
              <CardHeader><CardTitle>POST /proxy/erp/method</CardTitle></CardHeader>
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
            <Card>
              <CardHeader><CardTitle>POST /proxy/moodle/call</CardTitle></CardHeader>
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
            <Card>
              <CardHeader><CardTitle>Gateway BFF Catalog ({GATEWAY_ENDPOINTS.length} routes)</CardTitle></CardHeader>
              <CardContent>
                <pre className="text-xs overflow-auto max-h-96">
                  {GATEWAY_ENDPOINTS.map((e) => `${e.method} ${e.path} — ${e.description}`).join('\n')}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {result && (
          <Card>
            <CardContent className="p-4">
              <pre className="text-xs overflow-auto max-h-96">{result}</pre>
            </CardContent>
          </Card>
        )}
      </div>
    </FeatureGate>
  )
}
