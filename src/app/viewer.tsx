import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, useColorScheme, Alert, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { StorageAccessFramework, readAsStringAsync, copyAsync, cacheDirectory, deleteAsync } from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Markdown from 'react-native-markdown-display';
import { WebView } from 'react-native-webview';

export default function ViewerScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [uri, setUri] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const decodedName = name ? decodeURIComponent(name) : '';
  const extension = decodedName.split('.').pop()?.toLowerCase();

  useEffect(() => {
    loadUriAndContent();
    
    // Cleanup function runs when the user presses "Back" to leave the viewer
    return () => {
      AsyncStorage.setItem('last_opened_screen', 'index');
    };
  }, []);

  const loadUriAndContent = async () => {
    try {
      const storedUri = await AsyncStorage.getItem('current_file_uri');
      if (storedUri) {
        setUri(storedUri);
        await loadFileContent(storedUri);
      } else {
        setError('No file URI found.');
        setLoading(false);
      }
    } catch (e) {
      setError('Failed to load file reference.');
      setLoading(false);
    }
  };

  const loadFileContent = async (fileUri: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const tempFileUri = cacheDirectory + 'temp_' + Date.now() + (extension ? '.' + extension : '');
      await copyAsync({ from: fileUri, to: tempFileUri });
      
      const fileString = await readAsStringAsync(tempFileUri);
      setContent(fileString);
      setEditedContent(fileString);
      
      await deleteAsync(tempFileUri, { idempotent: true });
    } catch (e: any) {
      console.warn('Error reading file:', e);
      setError(`Could not read this file. Error: ${e.message || e}\nURI: ${fileUri}`);
    } finally {
      setLoading(false);
    }
  };

  const saveFileContent = async () => {
    if (!uri) return;
    try {
      setIsSaving(true);
      
      // Save the content back to the exact original SAF file
      await StorageAccessFramework.writeAsStringAsync(uri, editedContent);
      setContent(editedContent);
      setIsEditing(false);
      Alert.alert("Success", "File saved successfully!");
    } catch (e: any) {
      console.warn('Error saving file:', e);
      Alert.alert("Error", `Could not save file. ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const getAutoMode = () => {
    if (extension === 'html' || extension === 'htm') return 'html';
    if (extension === 'md' || extension === 'markdown') return 'md';
    
    // Auto-sniffing based on content
    if (content) {
      const trimmed = content.trim();
      if (trimmed.startsWith('<html') || trimmed.startsWith('<!DOCTYPE html>')) return 'html';
      if (trimmed.startsWith('# ') || trimmed.match(/^#{1,6} /m)) return 'md';
    }
    
    return 'text';
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
      return (
        <TextInput
          style={[styles.editor, { color: isDark ? '#ccc' : '#333', backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9' }]}
          multiline
          value={editedContent}
          onChangeText={setEditedContent}
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical="top"
        />
      );
    }

    const mode = getAutoMode();

    if (mode === 'html') {
      // Ensure mobile-friendly rendering if the HTML doesn't have a viewport meta tag
      let htmlContent = content;
      if (!htmlContent.toLowerCase().includes('meta name="viewport"')) {
        if (htmlContent.toLowerCase().includes('<head>')) {
          htmlContent = htmlContent.replace(/<head>/i, '<head><meta name="viewport" content="width=device-width, initial-scale=1.0">');
        } else {
          htmlContent = `<head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>${htmlContent}`;
        }
      }

      return (
        <WebView 
          originWhitelist={['*']}
          source={{ html: htmlContent }} 
          style={styles.webview}
          scalesPageToFit={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
        />
      );
    }

    if (mode === 'md') {
      return (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
          <Markdown
            style={{
              body: { color: isDark ? '#ffffff' : '#000000', fontSize: 16 },
              heading1: { color: isDark ? '#ffffff' : '#000000' },
              heading2: { color: isDark ? '#ffffff' : '#000000' },
              heading3: { color: isDark ? '#ffffff' : '#000000' },
              link: { color: '#007AFF' },
              code_block: { backgroundColor: isDark ? '#222' : '#f5f5f5', color: isDark ? '#eee' : '#333' },
              code_inline: { backgroundColor: isDark ? '#222' : '#f5f5f5', color: isDark ? '#eee' : '#333' }
            }}
          >
            {content}
          </Markdown>
        </ScrollView>
      );
    }

    return (
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.plainText, { color: isDark ? '#ccc' : '#333' }]}>
          {content}
        </Text>
      </ScrollView>
    );
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
             <TouchableOpacity onPress={() => { setIsEditing(false); setEditedContent(content || ''); }} style={{ marginLeft: 15 }}>
               <Text style={{ color: '#ff3b30', fontSize: 16 }}>Cancel</Text>
             </TouchableOpacity>
          ) : undefined
        }} 
      />
      {renderContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 16, textAlign: 'center' },
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 15 },
  webview: { flex: 1, backgroundColor: 'transparent' },
  plainText: { fontSize: 14, fontFamily: 'monospace' },
  editor: {
    flex: 1,
    padding: 15,
    fontSize: 14,
    fontFamily: 'monospace',
  }
});
