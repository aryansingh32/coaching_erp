import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getStudentAssessments } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function StudentAssessmentsScreen() {
  const { activeStudentId } = useAuthStore();

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['assessments', activeStudentId],
    queryFn: () => getStudentAssessments(activeStudentId!),
    enabled: !!activeStudentId,
  });

  const assessments = (res as any)?.data || [];

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
        <Text style={styles.errorText}>Failed to load assessments</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Report Card & Assessments</Text>
      
      {assessments.length === 0 ? (
        <Text style={styles.emptyText}>No assessments found.</Text>
      ) : (
        assessments.map((assessment: any, index: number) => (
          <View key={assessment.id || index} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.titleText}>{assessment.title}</Text>
              <View style={[styles.badge, assessment.grade >= 50 ? styles.badgeSuccess : styles.badgeDanger]}>
                <Text style={styles.badgeText}>
                  {assessment.grade}%
                </Text>
              </View>
            </View>
            <View style={styles.detailsRow}>
              <Text style={styles.subjectText}>{assessment.subject}</Text>
              <Text style={styles.dateText}>
                {new Date(assessment.date).toLocaleDateString()}
              </Text>
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
  card: {
    backgroundColor: '#1A1D25',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleText: { color: '#F9FAFB', fontSize: 16, fontWeight: '600' },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectText: { color: '#D1D5DB', fontSize: 14 },
  dateText: { color: '#9CA3AF', fontSize: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeSuccess: { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
  badgeDanger: { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  badgeText: { color: '#F9FAFB', fontSize: 14, fontWeight: 'bold' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 40 },
  errorText: { color: '#EF4444', fontSize: 16 },
});
