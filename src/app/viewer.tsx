import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useNavigation, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useFileContent } from '../hooks/useFileContent';
import { getFileHandler } from '../lib/fileHandlers';
import { useGroqSettings } from '../hooks/useGroqSettings';
import { FileChatSheet } from '../components/FileChatSheet';
import { InlineActionBar, type InlineActionKind } from '../components/InlineActionBar';
import { DiffReviewSheet } from '../components/DiffReviewSheet';
import { useInlineAction } from '../hooks/useInlineAction';
import { PromptModal } from '../components/PromptModal';
import { useTheme } from '../contexts/ThemeContext';

const INLINE_ACTION_LABELS: Record<InlineActionKind, string> = {
  summarize: 'Summarize',
  rewrite: 'Rewrite',
  translate: 'Translate',
  grammar: 'Fix grammar',
};

export default function ViewerScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [uri, setUri] = useState<string | null>(null);
  const [uriError, setUriError] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [pendingSelection, setPendingSelection] = useState<{ start: number; end: number; text: string } | null>(null);
  const [languagePromptVisible, setLanguagePromptVisible] = useState(false);
  const navigation = useNavigation();
  const { isDark } = useTheme();
  const { loaded: settingsLoaded, apiKey, model, aiEnabled } = useGroqSettings();
  const inlineAction = useInlineAction();

  const decodedName = name ? decodeURIComponent(name) : '';
  const extension = decodedName.split('.').pop()?.toLowerCase();

  const { content, loading, error: contentError, save } = useFileContent(uri, extension);
  const error = uriError || contentError;

  const loadUri = useCallback(async () => {
    try {
      const storedUri = await AsyncStorage.getItem('current_file_uri');
      if (storedUri) {
        setUri(storedUri);
      } else {
        setUriError('No file URI found.');
      }
    } catch {
      setUriError('Failed to load file reference.');
    }
  }, []);

  useEffect(() => {
    loadUri();

    // Cleanup function runs when the user presses "Back" to leave the viewer
    return () => {
      AsyncStorage.setItem('last_opened_screen', 'index');
    };
  }, [loadUri]);

  useEffect(() => {
    if (content !== null) setEditedContent(content);
  }, [content]);

  // Warn before leaving (Back button / gesture) while there are unsaved edits
  const hasUnsavedChanges = isEditing && editedContent !== content;
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    return navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. If you leave now they will be lost.',
        [
          { text: 'Keep editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]
      );
    });
  }, [hasUnsavedChanges, navigation]);

  const cancelEditing = () => {
    const discard = () => {
      setIsEditing(false);
      setEditedContent(content || '');
    };
    if (!hasUnsavedChanges) return discard();
    Alert.alert('Discard changes?', 'Your edits will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: discard },
    ]);
  };

  const [diffVisible, setDiffVisible] = useState(false);
  const [activeActionKind, setActiveActionKind] = useState<InlineActionKind>('rewrite');

  const runInlineAction = (instruction: string, selectedText: string, start: number, end: number) => {
    setPendingSelection({ start, end, text: selectedText });
    setDiffVisible(true);
    inlineAction.run({ instruction, text: selectedText, apiKey: apiKey!, model });
  };

  const handleInlineAction = (kind: InlineActionKind) => {
    const { start, end } = selection;
    const selectedText = editedContent.slice(start, end);
    if (!selectedText) return;
    if (!apiKey) {
      Alert.alert('No API key', 'Add a Groq API key in Settings to use AI features.');
      return;
    }

    setActiveActionKind(kind);

    if (kind === 'translate') {
      setPendingSelection({ start, end, text: selectedText });
      setLanguagePromptVisible(true);
      return;
    }

    const instructions: Record<'summarize' | 'rewrite' | 'grammar', string> = {
      summarize: 'Summarize the following text in a few concise sentences.',
      rewrite: 'Rewrite the following text to improve clarity and flow, preserving its meaning.',
      grammar: 'Fix grammar and spelling mistakes in the following text, making minimal other changes.',
    };
    runInlineAction(instructions[kind], selectedText, start, end);
  };

  const handleLanguageSubmit = (language: string) => {
    setLanguagePromptVisible(false);
    if (!pendingSelection || !language) return;
    runInlineAction(`Translate the following text to ${language}.`, pendingSelection.text, pendingSelection.start, pendingSelection.end);
  };

  const handleDiffAccept = (newText: string) => {
    if (!pendingSelection) return;
    const { start, end } = pendingSelection;
    setEditedContent((prev) => prev.slice(0, start) + newText + prev.slice(end));
    setSelection({ start: start + newText.length, end: start + newText.length });
    setPendingSelection(null);
    setDiffVisible(false);
    inlineAction.reset();
  };

  const handleDiffReject = () => {
    setPendingSelection(null);
    setDiffVisible(false);
    inlineAction.reset();
  };

  const saveFileContent = async () => {
    try {
      setIsSaving(true);
      await save(editedContent);
      setIsEditing(false);
      Alert.alert('Success', 'File saved successfully!');
    } catch (e: any) {
      Alert.alert('Error', `Could not save file. ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: isDark ? '#ff6b6b' : '#d32f2f' }]}>{error}</Text>
        </View>
      );
    }

    if (content === null) return null;

    if (isEditing) {
      const hasSelection = aiEnabled && !!apiKey && selection.end > selection.start;
      return (
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TextInput
            style={[styles.editor, { color: isDark ? '#ccc' : '#333', backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9' }]}
            multiline
            value={editedContent}
            onChangeText={setEditedContent}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            autoCapitalize="none"
            autoCorrect={false}
            textAlignVertical="top"
          />
          {hasSelection && (
            <InlineActionBar isDark={isDark} disabled={inlineAction.isLoading} onAction={handleInlineAction} />
          )}
        </KeyboardAvoidingView>
      );
    }

    const handler = getFileHandler(decodedName, content);
    return handler.render({ content, isDark });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#ffffff' }]}>
      <Stack.Screen
        options={{
          title: decodedName || 'File Viewer',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => isEditing ? saveFileContent() : setIsEditing(true)}
              disabled={isSaving}
              style={{ marginRight: 15 }}
            >
              <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: 'bold' }}>
                {isSaving ? 'Saving...' : (isEditing ? 'Save' : 'Edit')}
              </Text>
            </TouchableOpacity>
          ),
          headerLeft: isEditing ? () => (
             <TouchableOpacity onPress={cancelEditing} style={{ marginLeft: 15 }}>
               <Text style={{ color: '#ff3b30', fontSize: 16 }}>Cancel</Text>
             </TouchableOpacity>
          ) : undefined
        }}
      />
      {renderContent()}
      {settingsLoaded && aiEnabled && !loading && !error && content !== null && !isEditing && (
        <TouchableOpacity style={styles.fab} onPress={() => setChatVisible(true)}>
          <MaterialIcons name="chat" size={24} color="#fff" />
        </TouchableOpacity>
      )}
      <FileChatSheet
        visible={chatVisible}
        onClose={() => setChatVisible(false)}
        isDark={isDark}
        fileName={decodedName}
        content={content ?? ''}
        apiKey={apiKey}
        model={model}
      />
      <DiffReviewSheet
        visible={diffVisible}
        isDark={isDark}
        title={INLINE_ACTION_LABELS[activeActionKind]}
        originalText={pendingSelection?.text ?? ''}
        isLoading={inlineAction.isLoading}
        result={inlineAction.result}
        error={inlineAction.error}
        onAccept={handleDiffAccept}
        onReject={handleDiffReject}
      />
      <PromptModal
        visible={languagePromptVisible}
        isDark={isDark}
        title="Translate to"
        placeholder="e.g. Spanish, Hindi, French"
        confirmLabel="Translate"
        onCancel={() => setLanguagePromptVisible(false)}
        onSubmit={handleLanguageSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, textAlign: 'center' },
  editor: {
    flex: 1,
    padding: 15,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
});
