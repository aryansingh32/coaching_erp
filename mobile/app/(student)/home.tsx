import { useQuery } from '@tanstack/react-query'
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native'
import { listBatches, getPendingFees, updatePushToken } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { useEffect } from 'react'
import { registerForPushNotificationsAsync } from '@/lib/notifications'

export default function StudentHome() {
  const { erpId, activeStudentId, displayName, logout } = useAuthStore()

  useEffect(() => {
    async function setupPushNotifications() {
      try {
        const token = await registerForPushNotificationsAsync()
        const targetId = activeStudentId || erpId
        if (token && targetId) {
          await updatePushToken(targetId, token)
        }
      } catch (e) {
        console.error('Failed to setup push notifications', e)
      }
    }
    
    if (activeStudentId || erpId) {
      setupPushNotifications()
    }
  }, [activeStudentId, erpId])

  const { data: batchesRes } = useQuery({
    queryKey: ['batches'],
    queryFn: listBatches,
  })

  const { data: feesRes } = useQuery({
    queryKey: ['fees', erpId],
    queryFn: () => getPendingFees(erpId!),
    enabled: !!erpId,
  })

  const batches = (batchesRes as { data?: unknown[] })?.data ?? []
  const fees = (feesRes as { data?: { amount: number }[] })?.data ?? []
  const pendingTotal = fees.reduce((s, f) => s + f.amount, 0)

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Welcome, {displayName}</Text>
      <Text style={styles.subtitle}>Student Portal</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>My Batches ({batches.length})</Text>
        {batches.map((b: { name?: string; student_group_name?: string }, i: number) => (
          <Text key={i} style={styles.item}>
            • {b.student_group_name ?? b.name ?? 'Batch'}
          </Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Pending Fees</Text>
        <Text style={styles.amount}>₹{pendingTotal.toLocaleString('en-IN')}</Text>
      </View>

      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117', padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#F9FAFB' },
  subtitle: { color: '#6366F1', marginBottom: 20 },
  card: { backgroundColor: '#1A1D25', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { color: '#F9FAFB', fontWeight: '600', marginBottom: 8 },
  item: { color: '#9CA3AF', marginVertical: 4 },
  amount: { fontSize: 24, fontWeight: '700', color: '#F59E0B' },
  logout: { marginTop: 24, padding: 16, alignItems: 'center' },
  logoutText: { color: '#F87171' },
})
