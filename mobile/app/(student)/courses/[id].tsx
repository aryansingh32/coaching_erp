import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getCourseDetails } from '@/lib/api';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['course', id],
    queryFn: () => getCourseDetails(id as string),
    enabled: !!id,
  });

  const courseData = (res as any)?.data;
  const topics = courseData?.topics || [];

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (error || !courseData) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load course details.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: courseData.fullname || 'Course Details', headerBackTitle: 'Back' }} />
      <ScrollView style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.courseTitle}>{courseData.fullname}</Text>
          <Text style={styles.courseSummary}>
            {courseData.summary ? courseData.summary.replace(/<[^>]+>/g, '') : 'No description provided.'}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Course Content</Text>
        
        {topics.length === 0 ? (
          <Text style={styles.emptyText}>No topics available yet.</Text>
        ) : (
          topics.map((topic: any, index: number) => (
            <View key={topic.id || index} style={styles.topicCard}>
              <Text style={styles.topicTitle}>{topic.name}</Text>
              
              {topic.modules?.map((mod: any, mIndex: number) => (
                <Pressable 
                  key={mod.id || mIndex} 
                  style={styles.moduleItem}
                  onPress={() => {
                    // Navigate to appropriate viewer (PDF, Video, Quiz) based on mod.modname
                    // For BigBlueButton, navigate to live-class screen
                    if (mod.modname === 'bigbluebuttonbn') {
                      router.push(`/(student)/live-class/${mod.instance}`);
                    }
                  }}
                >
                  <Ionicons 
                    name={
                      mod.modname === 'resource' ? 'document-text-outline' :
                      mod.modname === 'url' ? 'link-outline' :
                      mod.modname === 'quiz' ? 'help-circle-outline' :
                      mod.modname === 'bigbluebuttonbn' ? 'videocam-outline' :
                      'folder-outline'
                    } 
                    size={20} 
                    color="#6366F1" 
                  />
                  <View style={styles.moduleInfo}>
                    <Text style={styles.moduleName}>{mod.name}</Text>
                    {mod.modname === 'bigbluebuttonbn' && (
                      <Text style={styles.liveBadge}>Live Class</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#4B5563" />
                </Pressable>
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1117' },
  headerCard: {
    backgroundColor: '#1A1D25',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#272A35',
  },
  courseTitle: { fontSize: 22, fontWeight: '700', color: '#F9FAFB', marginBottom: 8 },
  courseSummary: { fontSize: 14, color: '#9CA3AF', lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#F9FAFB', margin: 20, marginBottom: 10 },
  topicCard: {
    backgroundColor: '#1A1D25',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    padding: 16,
    backgroundColor: '#272A35',
  },
  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#272A35',
  },
  moduleInfo: { flex: 1, marginLeft: 12 },
  moduleName: { color: '#D1D5DB', fontSize: 15 },
  liveBadge: { color: '#EF4444', fontSize: 12, fontWeight: '600', marginTop: 2 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', margin: 20 },
  errorText: { color: '#EF4444', fontSize: 16 },
});
