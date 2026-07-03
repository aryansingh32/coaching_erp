import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getStudentSchedule } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function StudentScheduleScreen() {
  const { erpId } = useAuthStore();

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['schedule', erpId],
    queryFn: () => getStudentSchedule(erpId!),
    enabled: !!erpId,
  });

  const schedule = (res as any)?.data || [];

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
        <Text style={styles.errorText}>Failed to load schedule.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>My Schedule</Text>

      {schedule.length === 0 ? (
        <Text style={styles.emptyText}>No upcoming classes scheduled.</Text>
      ) : (
        schedule.map((item: any, index: number) => (
          <View key={index} style={styles.scheduleCard}>
            <View style={styles.timeColumn}>
              <Text style={styles.timeText}>{item.start_time || '09:00 AM'}</Text>
              <Text style={styles.durationText}>{item.duration || '60 min'}</Text>
            </View>
            <View style={styles.detailsColumn}>
              <Text style={styles.subjectText}>{item.subject || 'Subject'}</Text>
              <Text style={styles.instructorText}>{item.instructor || 'Instructor'}</Text>
              <View style={[styles.badge, item.is_live ? styles.badgeLive : styles.badgeOffline]}>
                <Text style={item.is_live ? styles.badgeTextLive : styles.badgeTextOffline}>
                  {item.is_live ? 'LIVE CLASS' : 'OFFLINE'}
                </Text>
              </View>
            </View>
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
  scheduleCard: {
    backgroundColor: '#1A1D25',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeColumn: {
    width: 80,
    borderRightWidth: 1,
    borderRightColor: '#272A35',
    paddingRight: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: { color: '#F9FAFB', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  durationText: { color: '#9CA3AF', fontSize: 12 },
  detailsColumn: {
    flex: 1,
  },
  subjectText: { color: '#F9FAFB', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  instructorText: { color: '#9CA3AF', fontSize: 14, marginBottom: 8 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeLive: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  badgeOffline: { backgroundColor: 'rgba(99, 102, 241, 0.2)' },
  badgeTextLive: { color: '#EF4444', fontSize: 10, fontWeight: 'bold' },
  badgeTextOffline: { color: '#6366F1', fontSize: 10, fontWeight: 'bold' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 40 },
  errorText: { color: '#EF4444', fontSize: 16 },
});
