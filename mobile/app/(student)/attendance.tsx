import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getStudentAttendance } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function StudentAttendanceScreen() {
  const { erpId } = useAuthStore();

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['attendance', erpId],
    queryFn: () => getStudentAttendance(erpId!),
    enabled: !!erpId,
  });

  const attendanceRecords = (res as any)?.data || [];

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load attendance</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Attendance Log</Text>
      
      {attendanceRecords.length === 0 ? (
        <Text style={styles.emptyText}>No attendance records found.</Text>
      ) : (
        attendanceRecords.map((record: any, index: number) => (
          <View key={index} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.dateText}>
                {new Date(record.date || record.punched_at).toLocaleDateString()}
              </Text>
              <View style={[styles.badge, record.status === 'Present' || record.punch_type === 'entry' ? styles.badgeSuccess : styles.badgeDanger]}>
                <Text style={styles.badgeText}>
                  {record.status || record.punch_type?.toUpperCase()}
                </Text>
              </View>
            </View>
            <Text style={styles.timeText}>
              {new Date(record.date || record.punched_at).toLocaleTimeString()}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1117' },
  header: { fontSize: 24, fontWeight: '700', color: '#F9FAFB', marginBottom: 20 },
  card: {
    backgroundColor: '#1A1D25',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: { color: '#F9FAFB', fontSize: 16, fontWeight: '600' },
  timeText: { color: '#9CA3AF', fontSize: 14 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  badgeSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  badgeDanger: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  badgeText: { color: '#F9FAFB', fontSize: 12, fontWeight: 'bold' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 40 },
  errorText: { color: '#EF4444', fontSize: 16 },
});
