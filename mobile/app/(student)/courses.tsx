import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { getStudentCourses } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function StudentCoursesScreen() {
  const { erpId } = useAuthStore();
  const router = useRouter();

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['courses', erpId],
    queryFn: () => getStudentCourses(erpId!),
    enabled: !!erpId,
  });

  const courses = (res as any)?.data || [];

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
        <Text style={styles.errorText}>Failed to load courses</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>My Courses</Text>
      
      {courses.length === 0 ? (
        <Text style={styles.emptyText}>No enrolled courses found.</Text>
      ) : (
        courses.map((course: any) => (
          <Pressable 
            key={course.id} 
            style={styles.card}
            onPress={() => router.push(`/(student)/courses/${course.id}`)}
          >
            <View style={styles.courseHeader}>
              <Text style={styles.courseName}>{course.fullname || 'Course Name'}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Active</Text>
              </View>
            </View>
            <Text style={styles.courseDesc} numberOfLines={2}>
              {course.summary ? course.summary.replace(/<[^>]+>/g, '') : 'Tap to view course contents and topics.'}
            </Text>
            
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${course.progress || 0}%` }]} />
              </View>
              <Text style={styles.progressText}>{course.progress || 0}% Complete</Text>
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
  card: {
    backgroundColor: '#1A1D25',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseName: { color: '#F9FAFB', fontSize: 18, fontWeight: '600', flex: 1, marginRight: 8 },
  courseDesc: { color: '#9CA3AF', fontSize: 14, marginBottom: 16, lineHeight: 20 },
  badge: { backgroundColor: 'rgba(99, 102, 241, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#6366F1', fontSize: 12, fontWeight: 'bold' },
  progressContainer: { marginTop: 8 },
  progressBar: { height: 6, backgroundColor: '#374151', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#6366F1' },
  progressText: { color: '#9CA3AF', fontSize: 12, marginTop: 6, textAlign: 'right' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 40 },
  errorText: { color: '#EF4444', fontSize: 16 },
});
