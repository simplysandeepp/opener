import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import type { FileHandler, FileHandlerProps } from './types';

function TextView({ content, isDark, onScrollDirectionChange }: FileHandlerProps) {
  const handleScroll = useScrollDirection((direction) => onScrollDirectionChange?.(direction));
  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <Text style={[styles.plainText, { color: isDark ? '#ccc' : '#333' }]}>{content}</Text>
    </ScrollView>
  );
}

/** Fallback handler: plain monospace text. Always matches, so it must stay last in the registry. */
export const textHandler: FileHandler = {
  id: 'text',
  canOpen: () => true,
  render: (props) => <TextView {...props} />,
};

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 15 },
  plainText: { fontSize: 14, fontFamily: 'monospace' },
});
