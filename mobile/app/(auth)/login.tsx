import { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { verifyOtp, sendOtp } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'

type Role = 'student' | 'instructor' | 'parent'

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = async () => {
    setLoading(true)
    setError('')
    try {
      await sendOtp(phone, role)
      setStep('otp')
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await verifyOtp(phone, otp, role) as {
        data: { accessToken: string; refreshToken: string; user: { name: string; first_name?: string; last_name?: string } }
      }
      const { accessToken, refreshToken, user } = res.data
      await login({
        accessToken,
        refreshToken,
        erpId: user.name,
        displayName: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.name,
        role,
      })
    } catch (e: unknown) {
      setError((e as { message?: string })?.message ?? 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CoachingOS</Text>
      <Text style={styles.subtitle}>Single app — Student, Teacher, Parent</Text>

      <View style={styles.roleRow}>
        {(['student', 'instructor', 'parent'] as Role[]).map((r) => (
          <Pressable
            key={r}
            style={[styles.roleBtn, role === r && styles.roleBtnActive]}
            onPress={() => setRole(r)}
          >
            <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
          </Pressable>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {step === 'phone' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Pressable style={styles.button} onPress={handleSendOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
          </Pressable>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="6-digit OTP"
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={setOtp}
          />
          <Pressable style={styles.button} onPress={handleVerify} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
          </Pressable>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#0F1117' },
  title: { fontSize: 32, fontWeight: '700', color: '#F9FAFB', textAlign: 'center' },
  subtitle: { color: '#9CA3AF', textAlign: 'center', marginBottom: 24 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  roleBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: '#1A1D25', alignItems: 'center' },
  roleBtnActive: { backgroundColor: '#6366F1' },
  roleText: { color: '#9CA3AF', fontSize: 12, textTransform: 'capitalize' },
  roleTextActive: { color: '#fff', fontWeight: '600' },
  input: { backgroundColor: '#1A1D25', color: '#F9FAFB', padding: 16, borderRadius: 12, marginBottom: 12 },
  button: { backgroundColor: '#6366F1', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600' },
  error: { color: '#F87171', marginBottom: 12, textAlign: 'center' },
})
