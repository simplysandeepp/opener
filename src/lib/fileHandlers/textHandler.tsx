import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import type { FileHandler } from './types';

/** Fallback handler: plain monospace text. Always matches, so it must stay last in the registry. */
export const textHandler: FileHandler = {
  id: 'text',
  canOpen: () => true,
  render: ({ content, isDark }) => (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
      <Text style={[styles.plainText, { color: isDark ? '#ccc' : '#333' }]}>{content}</Text>
    </ScrollView>
  ),
};

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 15 },
  plainText: { fontSize: 14, fontFamily: 'monospace' },
});
