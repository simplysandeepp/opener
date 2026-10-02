import React, { useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomSheet } from './BottomSheet';
import { useFileChat, type ChatMessage } from '../hooks/useFileChat';

interface FileChatSheetProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  fileName: string;
  content: string;
  apiKey: string | null;
  model: string;
}

const QUICK_ACTIONS = [
  { label: 'Summarize', prompt: 'Summarize this file.' },
  { label: 'Explain this code', prompt: 'Explain what this code does.' },
  { label: 'Find section about...', prompt: null }, // focuses the input instead of sending immediately
];

function Bubble({ message, isDark }: { message: ChatMessage; isDark: boolean }) {
  if (message.role === 'error') {
    return (
      <View style={[styles.bubble, styles.errorBubble]}>
        <Text style={styles.errorText}>{message.content}</Text>
      </View>
    );
  }
  const isUser = message.role === 'user';
  return (
    <View
      style={[
        styles.bubble,
        isUser
          ? { alignSelf: 'flex-end', backgroundColor: '#007AFF' }
          : { alignSelf: 'flex-start', backgroundColor: isDark ? '#2a2a2a' : '#eee' },
      ]}
    >
      <Text style={{ color: isUser ? '#fff' : (isDark ? '#fff' : '#000'), fontSize: 14 }}>{message.content}</Text>
    </View>
  );
}

export function FileChatSheet({ visible, onClose, isDark, fileName, content, apiKey, model }: FileChatSheetProps) {
  const { messages, isLoading, truncated, send } = useFileChat(fileName, content, apiKey, model);
  const [input, setInput] = useState('');
  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList>(null);

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    send(text);
    setInput('');
  };

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[number]) => {
    if (action.prompt) {
      handleSend(action.prompt);
    } else {
      setInput('Find the section about ');
      inputRef.current?.focus();
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} isDark={isDark}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
          Ask AI about {fileName}
        </Text>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <MaterialIcons name="close" size={22} color={isDark ? '#ccc' : '#444'} />
        </TouchableOpacity>
      </View>

      {!apiKey ? (
        <View style={styles.noKeyContainer}>
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
          {truncated && (
            <Text style={[styles.truncatedNotice, { color: isDark ? '#f9a825' : '#b26a00' }]}>
              This file is large — only the first part was sent as context.
            </Text>
          )}
          <View style={styles.quickActions}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[styles.chip, { backgroundColor: isDark ? '#2a2a2a' : '#eee' }]}
                onPress={() => handleQuickAction(action)}
                disabled={isLoading}
              >
                <Text style={{ color: isDark ? '#fff' : '#000', fontSize: 13 }}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            style={styles.messageList}
            contentContainerStyle={styles.messageListContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => <Bubble message={item} isDark={isDark} />}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: isDark ? '#777' : '#999' }]}>
                Ask a question about this file, or try one of the actions above.
              </Text>
            }
            ListFooterComponent={
              isLoading ? (
                <View style={[styles.bubble, { alignSelf: 'flex-start', backgroundColor: isDark ? '#2a2a2a' : '#eee' }]}>
                  <ActivityIndicator size="small" color="#007AFF" />
                </View>
              ) : null
            }
          />
          <View style={[styles.inputRow, { borderTopColor: isDark ? '#333' : '#e0e0e0' }]}>
            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about this file..."
              placeholderTextColor={isDark ? '#777' : '#999'}
              style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
              multiline
              editable={!isLoading}
            />
            <TouchableOpacity onPress={() => handleSend(input)} disabled={isLoading || !input.trim()} style={styles.sendButton}>
              <MaterialIcons name="send" size={20} color={isLoading || !input.trim() ? (isDark ? '#555' : '#ccc') : '#007AFF'} />
            </TouchableOpacity>
          </View>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10 },
  headerTitle: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 10 },
  noKeyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noKeyText: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  settingsButton: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  settingsButtonText: { color: '#fff', fontWeight: '600' },
  truncatedNotice: { fontSize: 12, paddingHorizontal: 16, paddingBottom: 8 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16 },
  messageList: { flex: 1 },
  messageListContent: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  emptyText: { fontSize: 13, textAlign: 'center', marginTop: 20 },
  bubble: { maxWidth: '85%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 2 },
  errorBubble: { alignSelf: 'center', backgroundColor: '#ffe5e5' },
  errorText: { color: '#d32f2f', fontSize: 13 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, gap: 8 },
  input: { flex: 1, fontSize: 14, maxHeight: 100, paddingVertical: 6 },
  sendButton: { padding: 6 },
});
