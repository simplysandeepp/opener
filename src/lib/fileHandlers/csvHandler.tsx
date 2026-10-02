import React from 'react';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';
import { parseCSV } from '../csv';
import type { FileHandler } from './types';

const CELL_WIDTH = 140;

function CsvTable({ content, isDark }: { content: string; isDark: boolean }) {
  const rows = parseCSV(content);
  if (rows.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: isDark ? '#aaa' : '#666' }}>This CSV file is empty.</Text>
      </View>
    );
  }

  const columnCount = Math.max(...rows.map((r) => r.length));
  const [header, ...body] = rows;

  const renderRow = (cells: string[], rowIndex: number) => (
    <View
      key={rowIndex}
      style={[
        styles.row,
        { borderBottomColor: isDark ? '#333' : '#e0e0e0' },
        rowIndex % 2 === 1 && { backgroundColor: isDark ? '#1a1a1a' : '#f7f7f7' },
      ]}
    >
      {Array.from({ length: columnCount }).map((_, colIndex) => (
        <Text
          key={colIndex}
          numberOfLines={1}
          style={[styles.cell, { color: isDark ? '#ddd' : '#222' }]}
        >
          {cells[colIndex] ?? ''}
        </Text>
      ))}
    </View>
  );

  return (
    <ScrollView horizontal style={styles.container}>
      <View>
        <View style={[styles.row, styles.headerRow, { backgroundColor: isDark ? '#2a2a2a' : '#eaeaea' }]}>
          {Array.from({ length: columnCount }).map((_, colIndex) => (
            <Text
              key={colIndex}
              numberOfLines={1}
              style={[styles.cell, styles.headerCell, { color: isDark ? '#fff' : '#000' }]}
            >
              {header[colIndex] ?? ''}
            </Text>
          ))}
        </View>
        <FlatList
          data={body}
          keyExtractor={(_, index) => String(index)}
          renderItem={({ item, index }) => renderRow(item, index)}
        />
      </View>
    </ScrollView>
  );
}

export const csvHandler: FileHandler = {
  id: 'csv',
  canOpen: (filename) => filename.split('.').pop()?.toLowerCase() === 'csv',
  render: ({ content, isDark }) => <CsvTable content={content} isDark={isDark} />,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  row: { flexDirection: 'row', borderBottomWidth: 1 },
  headerRow: { borderBottomWidth: 2 },
  cell: { width: CELL_WIDTH, paddingVertical: 10, paddingHorizontal: 8, fontSize: 13 },
  headerCell: { fontWeight: 'bold' },
});
