import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomSheet } from './BottomSheet';
import { diffWords, MAX_DIFF_TOKENS } from '../lib/diff';

interface DiffReviewSheetProps {
  visible: boolean;
  isDark: boolean;
  title: string;
  originalText: string;
  isLoading: boolean;
  result: string | null;
  error: string | null;
  onAccept: (newText: string) => void;
  onReject: () => void;
}

export function DiffReviewSheet({
  visible,
  isDark,
  title,
  originalText,
  isLoading,
  result,
  error,
  onAccept,
  onReject,
}: DiffReviewSheetProps) {
  const tooLongForWordDiff = originalText.length + (result?.length ?? 0) > MAX_DIFF_TOKENS * 12;

  return (
    <BottomSheet visible={visible} onClose={onReject} isDark={isDark} heightPercent={0.6}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: 16 }}>
        {isLoading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        )}
        {error && <Text style={styles.errorText}>{error}</Text>}
        {result !== null && !isLoading && (
          tooLongForWordDiff ? (
            <>
              <Text style={[styles.label, { color: isDark ? '#aaa' : '#666' }]}>Before</Text>
              <Text style={[styles.plainText, styles.removeText]}>{originalText}</Text>
              <Text style={[styles.label, { color: isDark ? '#aaa' : '#666' }]}>After</Text>
              <Text style={[styles.plainText, { color: isDark ? '#fff' : '#000' }]}>{result}</Text>
            </>
          ) : (
            <Text style={styles.diffText}>
              {diffWords(originalText, result).map((part, i) => (
                <Text
                  key={i}
                  style={
                    part.type === 'add'
                      ? styles.addText
                      : part.type === 'remove'
                      ? styles.removeText
                      : { color: isDark ? '#fff' : '#000' }
                  }
                >
                  {part.text}
                </Text>
              ))}
            </Text>
          )
        )}
      </ScrollView>

      {result !== null && !isLoading && (
        <View style={[styles.actions, { borderTopColor: isDark ? '#333' : '#e0e0e0' }]}>
          <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.acceptButton} onPress={() => onAccept(result)}>
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
      {(error || (isLoading === false && result === null)) && (
        <View style={[styles.actions, { borderTopColor: isDark ? '#333' : '#e0e0e0' }]}>
          <TouchableOpacity style={styles.rejectButton} onPress={onReject}>
            <Text style={styles.rejectText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingBottom: 10 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  body: { flex: 1 },
  center: { paddingVertical: 30, alignItems: 'center' },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginTop: 10, marginBottom: 4 },
  plainText: { fontSize: 14, lineHeight: 20 },
  diffText: { fontSize: 14, lineHeight: 22 },
  addText: { color: '#2e7d32', backgroundColor: '#e8f5e9' },
  removeText: { color: '#c62828', backgroundColor: '#ffebee', textDecorationLine: 'line-through' },
  errorText: { color: '#d32f2f', fontSize: 14 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1 },
  rejectButton: { paddingHorizontal: 16, paddingVertical: 8 },
  rejectText: { color: '#ff3b30', fontSize: 15, fontWeight: '600' },
  acceptButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  acceptText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
