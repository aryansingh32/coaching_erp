import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable, Alert } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getPendingFees } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function StudentFeesScreen() {
  const { erpId } = useAuthStore();

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['fees', erpId],
    queryFn: () => getPendingFees(erpId!),
    enabled: !!erpId,
  });

  const fees = (res as any)?.data || [];
  const pendingTotal = fees.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0);

  const handlePay = (fee: any) => {
    // In a real app, this would open Razorpay SDK
    // RazorpayCheckout.open(options)
    Alert.alert('Payment Initialization', `Initializing Razorpay for ₹${fee.amount}\nFee ID: ${fee.id}`);
  };

  const handlePayAll = () => {
    Alert.alert('Payment Initialization', `Initializing Razorpay for Total: ₹${pendingTotal}`);
  };

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
        <Text style={styles.errorText}>Failed to load fee details</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Fee Schedule</Text>
      
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Pending Amount</Text>
        <Text style={styles.summaryAmount}>₹{pendingTotal.toLocaleString('en-IN')}</Text>
        {pendingTotal > 0 && (
          <Pressable style={styles.payAllBtn} onPress={handlePayAll}>
            <Text style={styles.payAllBtnText}>Pay Full Amount</Text>
          </Pressable>
        )}
      </View>
      
      <Text style={styles.sectionTitle}>Pending Installments</Text>
      
      {fees.length === 0 ? (
        <Text style={styles.emptyText}>No pending fees found. You're all caught up!</Text>
      ) : (
        fees.map((fee: any, index: number) => (
          <View key={fee.id || index} style={styles.feeCard}>
            <View style={styles.feeInfo}>
              <Text style={styles.feeTitle}>{fee.title || `Installment ${index + 1}`}</Text>
              <Text style={styles.feeDate}>Due: {fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'N/A'}</Text>
              <Text style={styles.feeAmount}>₹{(fee.amount || 0).toLocaleString('en-IN')}</Text>
            </View>
            <Pressable style={styles.payBtn} onPress={() => handlePay(fee)}>
              <Text style={styles.payBtnText}>Pay Now</Text>
            </Pressable>
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
  summaryCard: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  summaryLabel: { color: '#E0E7FF', fontSize: 14, marginBottom: 8 },
  summaryAmount: { color: '#FFFFFF', fontSize: 36, fontWeight: 'bold', marginBottom: 16 },
  payAllBtn: { backgroundColor: '#FFFFFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  payAllBtnText: { color: '#4F46E5', fontWeight: '700', fontSize: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#F9FAFB', marginBottom: 16 },
  feeCard: {
    backgroundColor: '#1A1D25',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeInfo: { flex: 1 },
  feeTitle: { color: '#F9FAFB', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  feeDate: { color: '#EF4444', fontSize: 13, marginBottom: 8 },
  feeAmount: { color: '#F9FAFB', fontSize: 18, fontWeight: '700' },
  payBtn: { backgroundColor: '#6366F1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  payBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  emptyText: { color: '#10B981', textAlign: 'center', marginTop: 20, fontSize: 16 },
  errorText: { color: '#EF4444', fontSize: 16 },
});
