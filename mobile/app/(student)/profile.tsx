import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { getStudentProfile } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function StudentProfileScreen() {
  const { erpId, logout } = useAuthStore();

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['profile', erpId],
    queryFn: () => getStudentProfile(erpId!),
    enabled: !!erpId,
  });

  const profile = (res as any)?.data || {};

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
        <Text style={styles.errorText}>Failed to load profile.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile.image ? (
            <Image source={{ uri: profile.image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profile.first_name ? profile.first_name.charAt(0) : 'S'}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
        <Text style={styles.erpId}>ERP ID: {erpId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Information</Text>
        
        <View style={styles.infoRow}>
          <Ionicons name="call-outline" size={20} color="#9CA3AF" />
          <Text style={styles.infoText}>{profile.student_mobile_number || 'N/A'}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
          <Text style={styles.infoText}>{profile.student_email_id || 'N/A'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guardian Details</Text>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={20} color="#9CA3AF" />
          <Text style={styles.infoText}>{profile.guardian_name || 'N/A'}</Text>
        </View>
      </View>

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
        <Text style={styles.logoutBtnText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1117' },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#272A35',
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  name: { fontSize: 24, fontWeight: '700', color: '#F9FAFB', marginBottom: 4 },
  erpId: { fontSize: 14, color: '#9CA3AF' },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#272A35',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    color: '#F9FAFB',
    fontSize: 16,
    marginLeft: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginVertical: 20,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: { color: '#EF4444', fontSize: 16 },
});
