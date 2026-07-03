import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAuthStore } from '@/lib/auth-store';

function ChildSelector() {
  const { role, linkedStudents, activeStudentId, setActiveStudent } = useAuthStore();
  
  if (role !== 'parent' || !linkedStudents || linkedStudents.length < 2) {
    return null; // Don't show if not parent or only 1 child
  }
  
  return (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>Viewing:</Text>
      <View style={styles.childList}>
        {linkedStudents.map(studentId => (
          <Pressable 
            key={studentId}
            style={[styles.childBtn, activeStudentId === studentId && styles.childBtnActive]}
            onPress={() => setActiveStudent(studentId)}
          >
            <Text style={[styles.childBtnText, activeStudentId === studentId && styles.childBtnTextActive]}>
              {studentId}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function StudentLayout() {
  return (
    <>
      <ChildSelector />
      <Tabs
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#0F1117' },
          headerTintColor: '#F9FAFB',
          tabBarStyle: { backgroundColor: '#1A1D25', borderTopWidth: 0 },
          tabBarActiveTintColor: '#6366F1',
          tabBarInactiveTintColor: '#9CA3AF',
        }}
      >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color, size }) => <Ionicons name="book-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="assessments"
        options={{
          title: 'Grades',
          tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="fees"
        options={{
          title: 'Fees',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          href: null, // Hide from tabs, accessible via navigation
        }}
      />
      <Tabs.Screen
        name="live-class/[id]"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  selectorContainer: {
    backgroundColor: '#1A1D25',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#272A35',
  },
  selectorLabel: {
    color: '#9CA3AF',
    marginRight: 10,
    fontWeight: '600',
  },
  childList: {
    flexDirection: 'row',
    flex: 1,
    flexWrap: 'wrap',
    gap: 8,
  },
  childBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#374151',
  },
  childBtnActive: {
    backgroundColor: '#6366F1',
  },
  childBtnText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: 'bold',
  },
  childBtnTextActive: {
    color: '#FFFFFF',
  },
});
