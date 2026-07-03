import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as SecureStore from 'expo-secure-store';

export default function LiveClassScreen() {
  const { id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  
  // In a real scenario, you'd fetch the join URL from the backend using the mod.instance ID
  // Since we're bridging Moodle's BBB plugin, we might need a specific endpoint to get the join link
  // For now, we'll point it to a placeholder or constructed URL
  
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
  const joinUrl = `${API_BASE_URL}/moodle/bbb/join/${id}`; 

  const handleMessage = (event: any) => {
    // Handle messages from the webview if needed
    console.log('WebView message:', event.nativeEvent.data);
  };

  const injectedJavaScript = `
    // Pass authentication token if needed
    window.localStorage.setItem('bbb_auth', 'true');
    true;
  `;

  return (
    <>
      <Stack.Screen options={{ title: 'Live Class', headerBackTitle: 'Back', headerShown: false }} />
      <View style={styles.container}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        )}
        <WebView
          source={{ uri: joinUrl }}
          style={styles.webview}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onError={(e) => {
            Alert.alert('Connection Error', 'Failed to load the live class.');
            setIsLoading(false);
          }}
          injectedJavaScript={injectedJavaScript}
          onMessage={handleMessage}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F1117' },
  webview: { flex: 1, backgroundColor: 'transparent' },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0F1117',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  }
});
