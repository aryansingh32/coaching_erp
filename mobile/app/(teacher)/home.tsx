import { useQuery } from '@tanstack/react-query'
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native'
import { listBatches } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'

export default function TeacherHome() {
  const { displayName, logout } = useAuthStore()

  const { data: batchesRes } = useQuery({
    queryKey: ['batches'],
    queryFn: listBatches,
  })

  const batches = (batchesRes as { data?: { name?: string; student_group_name?: string; program?: string }[] })?.data ?? []

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Hello, {displayName}</Text>
      <Text style={styles.subtitle}>Teacher Portal</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today&apos;s Batches ({batches.length})</Text>
        {batches.map((b, i) => (
          <View key={i} style={styles.batchRow}>
            <Text style={styles.batchName}>{b.student_group_name ?? b.name ?? 'Batch'}</Text>
            <Text style={styles.program}>{b.program ?? ''}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  subtitle: { color: '#0EA5E9', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardTitle: { color: '#0F172A', fontWeight: '600', marginBottom: 12 },
  batchRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  batchName: { fontWeight: '600', color: '#0F172A' },
  program: { color: '#64748B', fontSize: 13 },
  logout: { marginTop: 24, padding: 16, alignItems: 'center' },
  logoutText: { color: '#DC2626' },
})
