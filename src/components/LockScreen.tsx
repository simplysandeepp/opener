import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface LockScreenProps {
  onUnlock: () => void;
  authenticating: boolean;
}

export function LockScreen({ onUnlock, authenticating }: LockScreenProps) {
  useEffect(() => {
    onUnlock();
  }, [onUnlock]);

  return (
    <View style={styles.container}>
      <MaterialIcons name="lock" size={48} color="#fff" />
      <Text style={styles.title}>Opener is locked</Text>
      <TouchableOpacity style={styles.button} onPress={onUnlock} disabled={authenticating}>
        {authenticating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Unlock</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0c', justifyContent: 'center', alignItems: 'center', padding: 30 },
  title: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 24 },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, minWidth: 120, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
