"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore, getRoleHomePath } from "@/lib/stores/auth-store"
import { verifyOtp, sendOtp } from "@/lib/api/services"
import type { UserRole } from "@/lib/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type LoginRole = 'student' | 'instructor' | 'parent' | 'admin' | 'super_admin'

const ROLE_OPTIONS: {
  value: LoginRole
  label: string
  portal: string
  apiRole: string
  frontendRole: UserRole
}[] = [
  { value: 'student', label: 'Student', portal: 'Student Portal', apiRole: 'student', frontendRole: 'student' },
  { value: 'instructor', label: 'Teacher', portal: 'Teacher Portal', apiRole: 'instructor', frontendRole: 'instructor' },
  { value: 'parent', label: 'Parent', portal: 'Parent View', apiRole: 'parent', frontendRole: 'parent' },
  { value: 'admin', label: 'Institute Admin', portal: 'Admin Panel', apiRole: 'admin', frontendRole: 'admin' },
  { value: 'super_admin', label: 'Platform Admin', portal: 'SaaS Console', apiRole: 'super_admin', frontendRole: 'super_admin' },
]

export default function LoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [role, setRole] = useState<LoginRole>("student")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const login = useAuthStore((state) => state.login)

  const roleConfig = ROLE_OPTIONS.find((r) => r.value === role)!

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.length < 10) {
      setError("Phone number must be at least 10 digits")
      return
    }
    setLoading(true)
    setError("")
    try {
      await sendOtp(phone, roleConfig.apiRole)
      setStep("otp")
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e?.message || "Failed to send OTP.")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== 6) {
      setError("OTP must be exactly 6 digits")
      return
    }
    setLoading(true)
    setError("")
    try {
      const result = await verifyOtp(phone, otp, roleConfig.apiRole)
      const erpId = result.user.name
      const displayName =
        [result.user.first_name, result.user.last_name].filter(Boolean).join(' ') || erpId

      login({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        erpId,
        displayName,
        role: roleConfig.frontendRole,
        tenantId: result.tenantId || 'default',
        branding: result.branding,
        linkedStudents: result.linkedStudents,
        features: result.features,
      })
      router.push(getRoleHomePath(roleConfig.frontendRole))
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e?.message || "Invalid OTP.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-card">
        <CardHeader className="space-y-2 text-center pb-8">
          <div className="mx-auto bg-primary w-12 h-12 rounded-xl flex items-center justify-center mb-4">
            <span className="text-primary-foreground font-bold text-xl">C</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome to CoachingOS</CardTitle>
          <CardDescription>
            {step === "phone" ? "Sign in with your registered phone number" : `Enter OTP sent to ${phone}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-6">{error}</div>
          )}
          {step === "phone" ? (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">I am a</label>
                <Select value={role} onValueChange={(v) => setRole(v as LoginRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label} — {opt.portal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">One-Time Password</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="text-center tracking-widest text-lg"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Verifying..." : "Sign In"}
              </Button>
              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-muted-foreground hover:text-primary"
                  onClick={() => { setStep("phone"); setOtp(""); setError("") }}
                >
                  Use a different number
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
