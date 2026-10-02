import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type InlineActionKind = 'summarize' | 'rewrite' | 'translate' | 'grammar';

const ACTIONS: { kind: InlineActionKind; label: string }[] = [
  { kind: 'summarize', label: 'Summarize' },
  { kind: 'rewrite', label: 'Rewrite' },
  { kind: 'translate', label: 'Translate' },
  { kind: 'grammar', label: 'Fix grammar' },
];

interface InlineActionBarProps {
  isDark: boolean;
  disabled?: boolean;
  onAction: (kind: InlineActionKind) => void;
}

export function InlineActionBar({ isDark, disabled, onAction }: InlineActionBarProps) {
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#eaeaea', borderTopColor: isDark ? '#333' : '#ddd' }]}>
      {ACTIONS.map((action) => (
        <TouchableOpacity
          key={action.kind}
          style={[styles.chip, { backgroundColor: isDark ? '#2a2a2a' : '#fff' }]}
          onPress={() => onAction(action.kind)}
          disabled={disabled}
        >
          <Text style={{ color: isDark ? '#fff' : '#000', fontSize: 13 }}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 10, borderTopWidth: 1 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
});
