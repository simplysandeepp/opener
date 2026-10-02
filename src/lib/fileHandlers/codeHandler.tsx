import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { tokenizeLine, tokenColor, CODE_EXTENSIONS } from '../syntaxHighlight';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import type { FileHandler, FileHandlerProps } from './types';

function CodeView({ content, isDark, onScrollDirectionChange }: FileHandlerProps) {
  const lines = content.split('\n');
  const handleScroll = useScrollDirection((direction) => onScrollDirectionChange?.(direction));

  return (
    <FlatList
      style={[styles.container, { backgroundColor: isDark ? '#17171a' : '#fafafa' }]}
      data={lines}
      keyExtractor={(_, index) => String(index)}
      onScroll={handleScroll}
      scrollEventThrottle={16}
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
  render: (props) => <CodeView {...props} />,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: 'row', paddingHorizontal: 10 },
  gutter: { width: 40, textAlign: 'right', marginRight: 10, fontSize: 13, fontFamily: 'monospace' },
  line: { flex: 1, fontSize: 13, fontFamily: 'monospace' },
});
