import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getBatchStudents, markManualAttendance } from '@/lib/api';

export default function MarkAttendanceScreen() {
  const { batchId } = useLocalSearchParams();
  const router = useRouter();
  
  const [attendance, setAttendance] = useState<Record<string, 'Present' | 'Absent'>>({});

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['batchStudents', batchId],
    queryFn: () => getBatchStudents(batchId as string),
    enabled: !!batchId,
  });

  const students = (res as any)?.data || [];

  const mutation = useMutation({
    mutationFn: async (records: any[]) => {
      // API expects one by one or bulk, let's assume one by one for simplicity if no bulk API exists
      const promises = records.map(record => markManualAttendance(record));
      return Promise.all(promises);
    },
    onSuccess: () => {
      Alert.alert('Success', 'Attendance marked successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to mark attendance. Please try again.');
    }
  });

  const handleToggle = (studentId: string, status: 'Present' | 'Absent') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmit = () => {
    if (Object.keys(attendance).length === 0) {
      Alert.alert('Notice', 'No attendance marked.');
      return;
    }
    
    const records = Object.keys(attendance).map(studentId => ({
      studentId,
      date: new Date().toISOString().split('T')[0],
      status: attendance[studentId],
      batchId: batchId as string
    }));
    
    mutation.mutate(records);
  };

  if (!batchId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No batch selected.</Text>
      </View>
    );
  }

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
        <Text style={styles.errorText}>Failed to load students.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.header}>Mark Attendance</Text>
        <Text style={styles.subHeader}>Batch: {batchId}</Text>
        <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>

        {students.length === 0 ? (
          <Text style={styles.emptyText}>No students in this batch.</Text>
        ) : (
          students.map((student: any) => (
            <View key={student.name || student.erpId} style={styles.studentCard}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.first_name || student.name}</Text>
                <Text style={styles.studentId}>{student.name || student.erpId}</Text>
              </View>
              
              <View style={styles.actionGroup}>
                <Pressable
                  style={[
                    styles.toggleBtn,
                    attendance[student.name || student.erpId] === 'Present' ? styles.presentBtnActive : styles.toggleBtnInactive
                  ]}
                  onPress={() => handleToggle(student.name || student.erpId, 'Present')}
                >
                  <Text style={styles.toggleBtnText}>P</Text>
                </Pressable>
                
                <Pressable
                  style={[
                    styles.toggleBtn,
                    attendance[student.name || student.erpId] === 'Absent' ? styles.absentBtnActive : styles.toggleBtnInactive
                  ]}
                  onPress={() => handleToggle(student.name || student.erpId, 'Absent')}
                >
                  <Text style={styles.toggleBtnText}>A</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      
      {students.length > 0 && (
        <View style={styles.footer}>
          <Pressable 
            style={[styles.submitBtn, mutation.isPending && styles.submitBtnDisabled]} 
            onPress={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Attendance</Text>
            )}
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1117' },
  header: { fontSize: 24, fontWeight: '700', color: '#F9FAFB', marginHorizontal: 20, marginTop: 20 },
  subHeader: { color: '#6366F1', fontSize: 16, marginHorizontal: 20, marginTop: 4 },
  dateText: { color: '#9CA3AF', fontSize: 14, marginHorizontal: 20, marginBottom: 20, marginTop: 4 },
  studentCard: {
    backgroundColor: '#1A1D25',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  studentInfo: { flex: 1 },
  studentName: { color: '#F9FAFB', fontSize: 16, fontWeight: '600' },
  studentId: { color: '#9CA3AF', fontSize: 13, marginTop: 4 },
  actionGroup: { flexDirection: 'row', gap: 8 },
  toggleBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  toggleBtnInactive: { backgroundColor: '#374151' },
  presentBtnActive: { backgroundColor: '#10B981' },
  absentBtnActive: { backgroundColor: '#EF4444' },
  toggleBtnText: { color: '#FFFFFF', fontWeight: 'bold' },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#272A35',
    backgroundColor: '#1A1D25'
  },
  submitBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 40 },
  errorText: { color: '#EF4444', fontSize: 16 },
});
