import React, { useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheet } from './BottomSheet';
import { ChatMarkdown } from './ChatMarkdown';
import { useFolderIndex } from '../hooks/useFolderIndex';
import { useFolderRag, type FolderRagSource } from '../hooks/useFolderRag';

interface FolderRagSheetProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  folderUri: string;
  folderName: string;
  apiKey: string | null;
  model: string;
  onOpenSource: (uri: string, name: string) => void;
}

function timeAgo(timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function FolderRagSheet({ visible, onClose, isDark, folderUri, folderName, apiKey, model, onOpenSource }: FolderRagSheetProps) {
  const { status, isIndexing, progress, startIndexing, cancelIndexing } = useFolderIndex(folderUri);
  const { isLoading, answer, error, ask, reset } = useFolderRag(folderUri, apiKey, model);
  const [question, setQuestion] = useState('');

  const handleAsk = () => {
    if (!question.trim()) return;
    ask(question);
  };

  const handleSource = (source: FolderRagSource) => {
    onClose();
    onOpenSource(source.uri, source.name);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} isDark={isDark}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
          Ask AI about {folderName}
        </Text>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <MaterialIcons name="close" size={22} color={isDark ? '#ccc' : '#444'} />
        </TouchableOpacity>
      </View>

      {!apiKey ? (
        <View style={styles.center}>
          <Text style={[styles.noKeyText, { color: isDark ? '#aaa' : '#666' }]}>
            Add a Groq API key in Settings to use AI features.
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              onClose();
              router.push('/settings');
            }}
          >
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.statusRow}>
            {status ? (
              <Text style={[styles.statusText, { color: isDark ? '#aaa' : '#666' }]}>
                Indexed {status.fileCount} file{status.fileCount === 1 ? '' : 's'} · {timeAgo(status.indexedAt)}
              </Text>
            ) : (
              <Text style={[styles.statusText, { color: isDark ? '#aaa' : '#666' }]}>Not indexed yet</Text>
            )}
            {isIndexing ? (
              <TouchableOpacity onPress={cancelIndexing}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={startIndexing}>
                <Text style={styles.actionText}>{status ? 'Re-index' : 'Index this folder'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {isIndexing && (
            <View style={styles.progressRow}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={[styles.progressText, { color: isDark ? '#aaa' : '#666' }]}>
                Indexing {progress?.done ?? 0}
                {progress?.total ? ` / ${progress.total}` : ''}...
              </Text>
            </View>
          )}

          <FlatList
            data={answer ? [answer] : []}
            keyExtractor={() => 'answer'}
            style={styles.answerList}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              !isLoading && !error ? (
                <Text style={[styles.emptyText, { color: isDark ? '#777' : '#999' }]}>
                  {status ? 'Ask a question about any file in this folder.' : 'Index this folder first, then ask a question.'}
                </Text>
              ) : null
            }
            renderItem={({ item }) => (
              <View>
                <ChatMarkdown content={item.answer} color={isDark ? '#fff' : '#000'} isDark={isDark} />
                {item.sources.length > 0 && (
                  <View style={styles.sources}>
                    <Text style={[styles.sourcesLabel, { color: isDark ? '#aaa' : '#666' }]}>Sources</Text>
                    <View style={styles.sourceChips}>
                      {item.sources.map((source) => (
                        <TouchableOpacity
                          key={source.uri}
                          style={[styles.sourceChip, { backgroundColor: isDark ? '#2a2a2a' : '#eee' }]}
                          onPress={() => handleSource(source)}
                        >
                          <Text style={{ color: '#007AFF', fontSize: 12 }} numberOfLines={1}>{source.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}
            ListFooterComponent={
              isLoading ? (
                <View style={{ paddingTop: 10 }}>
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              ) : error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : null
            }
          />

          <View style={[styles.inputRow, { borderTopColor: isDark ? '#333' : '#e0e0e0' }]}>
            <TextInput
              value={question}
              onChangeText={setQuestion}
              placeholder={status ? 'Ask about this folder...' : 'Index this folder to ask questions'}
              placeholderTextColor={isDark ? '#777' : '#999'}
              style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
              editable={!isLoading && !!status}
              onSubmitEditing={handleAsk}
            />
            <TouchableOpacity onPress={handleAsk} disabled={isLoading || !status || !question.trim()} style={styles.sendButton}>
              <MaterialIcons
                name="send"
                size={20}
                color={isLoading || !status || !question.trim() ? (isDark ? '#555' : '#ccc') : '#007AFF'}
              />
            </TouchableOpacity>
          </View>
          {answer && (
            <TouchableOpacity onPress={reset} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>Clear answer</Text>
            </TouchableOpacity>
          )}
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  headerTitle: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 10 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noKeyText: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  settingsButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  settingsButtonText: { color: '#fff', fontWeight: '600' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  statusText: { fontSize: 12, flex: 1 },
  actionText: { color: '#007AFF', fontSize: 13, fontWeight: '600' },
  cancelText: { color: '#ff3b30', fontSize: 13, fontWeight: '600' },
  progressRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  progressText: { fontSize: 12 },
  answerList: { flex: 1 },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 20 },
  errorText: { color: '#d32f2f', fontSize: 13, textAlign: 'center' },
  sources: { marginTop: 12 },
  sourcesLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 },
  sourceChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sourceChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, maxWidth: 160 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, gap: 8 },
  input: { flex: 1, fontSize: 14, paddingVertical: 6 },
  sendButton: { padding: 6 },
  clearButton: { alignItems: 'center', paddingVertical: 8 },
  clearButtonText: { color: '#ff3b30', fontSize: 12 },
});
