import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { listBatches } from '@/lib/api';

export default function TeacherBatchesScreen() {
  const router = useRouter();

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['batches'],
    queryFn: listBatches,
  });

  const batches = (res as any)?.data || [];

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
        <Text style={styles.errorText}>Failed to load batches.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>My Assigned Batches</Text>

      {batches.length === 0 ? (
        <Text style={styles.emptyText}>No batches assigned to you.</Text>
      ) : (
        batches.map((batch: any, index: number) => (
          <Pressable 
            key={batch.name || index} 
            style={styles.batchCard}
            onPress={() => router.push(`/(teacher)/attendance?batchId=${batch.name}`)}
          >
            <View style={styles.batchHeader}>
              <Text style={styles.batchName}>{batch.student_group_name || batch.name}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Active</Text>
              </View>
            </View>
            <View style={styles.batchDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="people-outline" size={16} color="#9CA3AF" />
                <Text style={styles.detailText}>{batch.max_students || 0} Students Capacity</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="book-outline" size={16} color="#9CA3AF" />
                <Text style={styles.detailText}>{batch.program || 'General Program'}</Text>
              </View>
            </View>
            <View style={styles.actionRow}>
              <Text style={styles.actionText}>Mark Attendance</Text>
              <Ionicons name="chevron-forward" size={16} color="#6366F1" />
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1117' },
  header: { fontSize: 24, fontWeight: '700', color: '#F9FAFB', marginBottom: 20 },
  batchCard: {
    backgroundColor: '#1A1D25',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  batchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  batchName: { color: '#F9FAFB', fontSize: 18, fontWeight: '600' },
  badge: { backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#10B981', fontSize: 12, fontWeight: 'bold' },
  batchDetails: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#272A35',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: { color: '#D1D5DB', fontSize: 14, marginLeft: 8 },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionText: { color: '#6366F1', fontSize: 14, fontWeight: '600', marginRight: 4 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 40 },
  errorText: { color: '#EF4444', fontSize: 16 },
});
