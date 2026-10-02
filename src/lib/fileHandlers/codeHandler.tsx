import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { tokenizeLine, tokenColor, CODE_EXTENSIONS } from '../syntaxHighlight';
import type { FileHandler } from './types';

function CodeView({ content, isDark }: { content: string; isDark: boolean }) {
  const lines = content.split('\n');

  return (
    <FlatList
      style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#fafafa' }]}
      data={lines}
      keyExtractor={(_, index) => String(index)}
      renderItem={({ item: line, index }) => (
        <View style={styles.row}>
          <Text style={[styles.gutter, { color: isDark ? '#5a5a5a' : '#999' }]}>{index + 1}</Text>
          <Text style={styles.line}>
            {tokenizeLine(line).map((token, i) => (
              <Text key={i} style={{ color: tokenColor(token.type, isDark) }}>
                {token.text}
              </Text>
            ))}
          </Text>
        </View>
      )}
    />
  );
}

export const codeHandler: FileHandler = {
  id: 'code',
  canOpen: (filename) => CODE_EXTENSIONS.has(filename.split('.').pop()?.toLowerCase() || ''),
  render: ({ content, isDark }) => <CodeView content={content} isDark={isDark} />,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: 'row', paddingHorizontal: 10 },
  gutter: { width: 40, textAlign: 'right', marginRight: 10, fontSize: 13, fontFamily: 'monospace' },
  line: { flex: 1, fontSize: 13, fontFamily: 'monospace' },
});
