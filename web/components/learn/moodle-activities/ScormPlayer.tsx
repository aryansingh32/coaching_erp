"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function ScormPlayer({ launchUrl, title }: { launchUrl: string, title?: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  if (!launchUrl) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="flex items-center gap-3 p-4 text-red-800">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          <p className="text-sm font-medium">Invalid SCORM Launch URL.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-inst-border shadow-sm overflow-hidden flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'h-[600px]'}`}>
      <div className="bg-muted/80 border-b p-2 flex justify-between items-center shrink-0">
        <span className="text-sm font-semibold ml-2 truncate">{title || 'SCORM Package'}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="h-8 w-8 p-0"
          title="Toggle Fullscreen"
        >
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 w-full bg-black relative">
        <iframe
          src={launchUrl}
          className="w-full h-full border-0 absolute inset-0"
          allow="autoplay; fullscreen"
          title={title || "SCORM Player"}
        />
      </div>
    </Card>
  )
}
