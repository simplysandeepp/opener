import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import type { FileHandler, FileHandlerProps } from './types';

function MarkdownView({ content, isDark, onScrollDirectionChange }: FileHandlerProps) {
  const handleScroll = useScrollDirection((direction) => onScrollDirectionChange?.(direction));
  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <Markdown
        style={{
          body: { color: isDark ? '#ffffff' : '#000000', fontSize: 16 },
          heading1: { color: isDark ? '#ffffff' : '#000000' },
          heading2: { color: isDark ? '#ffffff' : '#000000' },
          heading3: { color: isDark ? '#ffffff' : '#000000' },
          link: { color: '#007AFF' },
          fence: {
            backgroundColor: isDark ? '#17171a' : '#f0f0f0',
            color: isDark ? '#d4d4d4' : '#333333',
            fontFamily: 'monospace',
            padding: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isDark ? '#333' : '#ddd',
            marginVertical: 10,
          },
          code_block: {
            backgroundColor: isDark ? '#17171a' : '#f0f0f0',
            color: isDark ? '#d4d4d4' : '#333333',
            fontFamily: 'monospace',
            padding: 10,
            borderRadius: 8,
            marginVertical: 10,
          },
          code_inline: {
            backgroundColor: isDark ? '#2a2a2a' : '#e0e0e0',
            color: isDark ? '#ff9800' : '#d32f2f',
            fontFamily: 'monospace',
            borderRadius: 4,
            paddingHorizontal: 4,
          },
        }}
      >
        {content}
      </Markdown>
    </ScrollView>
  );
}

export const markdownHandler: FileHandler = {
  id: 'markdown',
  canOpen: (filename, content) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'md' || ext === 'markdown') return true;
    const trimmed = content.trim();
    return trimmed.startsWith('# ') || /^#{1,6} /m.test(trimmed);
  },
  render: (props) => <MarkdownView {...props} />,
};

const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 15 },
});
