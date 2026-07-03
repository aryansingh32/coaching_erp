import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { useQuery } from '@tanstack/react-query';
import { getAnalyticsEmbedUrl } from '@/lib/api';
import { useAuthStore } from '@/lib/auth-store';

export default function AnalyticsScreen() {
  const { activeStudentId } = useAuthStore();
  const [isWebviewLoading, setIsWebviewLoading] = useState(true);

  const { data: res, isLoading, error } = useQuery({
    queryKey: ['analyticsEmbed', activeStudentId],
    queryFn: () => getAnalyticsEmbedUrl(activeStudentId!),
    enabled: !!activeStudentId,
  });

  const embedUrl = (res as any)?.data?.embedUrl;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Generating secure analytics token...</Text>
      </View>
    );
  }

  if (error || !embedUrl) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Failed to load analytics dashboard.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isWebviewLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      )}
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        onLoadStart={() => setIsWebviewLoading(true)}
        onLoadEnd={() => setIsWebviewLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F1117' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F1117',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: { color: '#9CA3AF', marginTop: 12 },
  errorText: { color: '#EF4444', fontSize: 16 },
});
