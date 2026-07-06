"use client"

import { useState } from "react"
import { useAddMoodleForumDiscussion } from "@/lib/api/hooks"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageSquare, Send } from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/lib/stores/auth-store"

export function DiscussionThread({ forumId, forumName }: { forumId: number, forumName?: string }) {
  const addDiscussion = useAddMoodleForumDiscussion()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [threads, setThreads] = useState<{ id: number; subject: string; message: string; author: string; date: string }[]>([])
  
  const displayName = useAuthStore(s => s.displayName) || "Student"

  const handlePost = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error("Please enter a subject and message")
      return
    }

    try {
      await addDiscussion.mutateAsync({ forumId, subject, message })
      
      // Optimistically add to local state
      setThreads(prev => [{
        id: Date.now(),
        subject,
        message,
        author: displayName,
        date: new Date().toLocaleString()
      }, ...prev])
      
      setSubject('')
      setMessage('')
      toast.success("Discussion posted successfully")
    } catch (err: unknown) {
      toast.error((err as { message?: string })?.message || "Failed to post discussion")
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-inst-border shadow-sm">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            Add a new discussion topic
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <Input 
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Discussion subject"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Message</label>
            <textarea
              className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="What's on your mind?"
            />
          </div>
        </CardContent>
        <CardFooter className="bg-muted/10 border-t justify-end">
          <Button onClick={handlePost} disabled={addDiscussion.isPending}>
            <Send className="w-4 h-4 mr-2" />
            {addDiscussion.isPending ? "Posting..." : "Post to forum"}
          </Button>
        </CardFooter>
      </Card>
      
      {threads.length > 0 && (
        <div className="space-y-4 mt-8">
          <h3 className="font-semibold text-lg">Recent Discussions</h3>
          {threads.map(thread => (
            <Card key={thread.id} className="border-inst-border/50">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-inst-primary">{thread.subject}</h4>
                  <span className="text-xs text-muted-foreground">{thread.date}</span>
                </div>
                <p className="text-sm text-foreground/80 mb-3">{thread.message}</p>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                    {thread.author.charAt(0)}
                  </div>
                  Posted by {thread.author}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
