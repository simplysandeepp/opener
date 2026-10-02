import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { FileHandler } from './types';

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function valueColor(value: JsonValue, isDark: boolean): string {
  if (typeof value === 'string') return isDark ? '#ce9178' : '#a31515';
  if (typeof value === 'number') return isDark ? '#b5cea8' : '#098658';
  if (typeof value === 'boolean') return isDark ? '#569cd6' : '#0000ff';
  if (value === null) return isDark ? '#808080' : '#808080';
  return isDark ? '#d4d4d4' : '#333333';
}

function formatPrimitive(value: JsonValue): string {
  if (typeof value === 'string') return `"${value}"`;
  if (value === null) return 'null';
  return String(value);
}

function JsonNode({ label, value, isDark, depth }: { label: string | null; value: JsonValue; isDark: boolean; depth: number }) {
  const isContainer = value !== null && typeof value === 'object';
  const [collapsed, setCollapsed] = useState(depth >= 2);

  const textColor = isDark ? '#9cdcfe' : '#001080';
  const labelPrefix = label !== null ? (
    <Text style={{ color: textColor, fontFamily: 'monospace' }}>{label}: </Text>
  ) : null;

  if (!isContainer) {
    return (
      <View style={[styles.row, { paddingLeft: depth * 16 }]}>
        <Text style={styles.text}>
          {labelPrefix}
          <Text style={{ color: valueColor(value, isDark), fontFamily: 'monospace' }}>{formatPrimitive(value)}</Text>
        </Text>
      </View>
    );
  }

  const entries: [string, JsonValue][] = Array.isArray(value)
    ? value.map((v, i) => [String(i), v])
    : Object.entries(value as { [key: string]: JsonValue });
  const isArray = Array.isArray(value);
  const bracket = isArray ? ['[', ']'] : ['{', '}'];
  const summary = `${bracket[0]} ${entries.length} ${entries.length === 1 ? 'item' : 'items'} ${bracket[1]}`;

  return (
    <View>
      <TouchableOpacity
        style={[styles.row, { paddingLeft: depth * 16 }]}
        onPress={() => setCollapsed((c) => !c)}
        activeOpacity={0.6}
      >
        <Text style={[styles.arrow, { color: isDark ? '#aaa' : '#666' }]}>{collapsed ? '▶' : '▼'}</Text>
        <Text style={styles.text}>
          {labelPrefix}
          <Text style={{ color: isDark ? '#808080' : '#808080', fontFamily: 'monospace' }}>{summary}</Text>
        </Text>
      </TouchableOpacity>
      {!collapsed && entries.map(([key, v]) => (
        <JsonNode key={key} label={isArray ? null : key} value={v} isDark={isDark} depth={depth + 1} />
      ))}
    </View>
  );
}

function JsonTreeView({ content, isDark }: { content: string; isDark: boolean }) {
  let parsed: JsonValue;
  try {
    parsed = JSON.parse(content);
  } catch (e: any) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 15 }}>
        <Text style={{ color: isDark ? '#ff6b6b' : '#d32f2f', marginBottom: 10 }}>
          Invalid JSON: {e.message}
        </Text>
        <Text style={{ color: isDark ? '#ccc' : '#333', fontFamily: 'monospace', fontSize: 13 }}>{content}</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#1e1e1e' : '#fafafa' }]} contentContainerStyle={{ padding: 15 }}>
      <JsonNode label={null} value={parsed} isDark={isDark} depth={0} />
    </ScrollView>
  );
}

export const jsonHandler: FileHandler = {
  id: 'json',
  canOpen: (filename) => filename.split('.').pop()?.toLowerCase() === 'json',
  render: ({ content, isDark }) => <JsonTreeView content={content} isDark={isDark} />,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 3 },
  arrow: { width: 18, fontSize: 12, marginTop: 2 },
  text: { fontSize: 13, flexShrink: 1 },
});
