import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Stack } from 'expo-router';
import { useGroqSettings } from '../hooks/useGroqSettings';
import { listModels, GroqError } from '../lib/llm/groq';
import { SelectModal } from '../components/SelectModal';

function errorMessage(e: unknown): string {
  if (e instanceof GroqError) return e.message;
  return 'Something went wrong.';
}

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { loaded, apiKey, setApiKey, model, setModel, aiEnabled, setAiEnabled } = useGroqSettings();

  const [keyDraft, setKeyDraft] = useState('');
  const [testing, setTesting] = useState(false);
  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const [modelOptions, setModelOptions] = useState<{ id: string; label: string }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const effectiveKey = keyDraft || apiKey || '';

  const handleSaveKey = async () => {
    await setApiKey(keyDraft);
    setKeyDraft('');
    Alert.alert('Saved', apiKey || keyDraft ? 'API key saved.' : 'API key cleared.');
  };

  const handleTestKey = async () => {
    if (!effectiveKey) {
      Alert.alert('No key', 'Enter a Groq API key first.');
      return;
    }
    setTesting(true);
    try {
      const models = await listModels({ apiKey: effectiveKey, timeoutMs: 10000 });
      Alert.alert('Success', `Key is valid. Found ${models.length} available model${models.length === 1 ? '' : 's'}.`);
    } catch (e) {
      Alert.alert('Test failed', errorMessage(e));
    } finally {
      setTesting(false);
    }
  };

  const openModelPicker = async () => {
    if (!effectiveKey) {
      Alert.alert('No key', 'Add and save a Groq API key first.');
      return;
    }
    setLoadingModels(true);
    try {
      const models = await listModels({ apiKey: effectiveKey, timeoutMs: 10000 });
      setModelOptions(models.map((m) => ({ id: m.id, label: m.id })));
      setModelPickerVisible(true);
    } catch (e) {
      Alert.alert('Could not load models', errorMessage(e));
    } finally {
      setLoadingModels(false);
    }
  };

  if (!loaded) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Settings' }} />

      <Text style={[styles.sectionTitle, { color: isDark ? '#aaa' : '#666' }]}>AI FEATURES (GROQ)</Text>
      <View style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#fff' }]}>
        <Text style={[styles.notice, { color: isDark ? '#aaa' : '#666' }]}>
          Opener can optionally use Groq&rsquo;s AI to help with your files (summaries, explanations, Q&amp;A).
          This is off by default and the app works fully offline without it. When enabled, the text of
          files you ask about is sent to Groq&rsquo;s servers.
        </Text>

        <View style={styles.row}>
          <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>Enable AI features</Text>
          <Switch value={aiEnabled} onValueChange={setAiEnabled} disabled={!apiKey && !aiEnabled} />
        </View>
        {!apiKey && (
          <Text style={[styles.hint, { color: isDark ? '#777' : '#999' }]}>Add an API key below to enable AI features.</Text>
        )}

        <Text style={[styles.label, { color: isDark ? '#fff' : '#000', marginTop: 16 }]}>Groq API key</Text>
        <TextInput
          value={keyDraft}
          onChangeText={setKeyDraft}
          placeholder={apiKey ? '•••••••••••••••••• (saved)' : 'gsk_...'}
          placeholderTextColor={isDark ? '#777' : '#999'}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#444' : '#ccc' }]}
        />
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleTestKey} disabled={testing}>
            {testing ? <ActivityIndicator size="small" color="#007AFF" /> : <Text style={styles.secondaryButtonText}>Test key</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveKey} disabled={!keyDraft}>
            <Text style={styles.primaryButtonText}>Save key</Text>
          </TouchableOpacity>
        </View>
        {apiKey && (
          <TouchableOpacity onPress={() => setApiKey('')}>
            <Text style={styles.removeKeyText}>Remove saved key</Text>
          </TouchableOpacity>
        )}

        <Text style={[styles.label, { color: isDark ? '#fff' : '#000', marginTop: 16 }]}>Model</Text>
        <TouchableOpacity style={[styles.modelRow, { borderColor: isDark ? '#444' : '#ccc' }]} onPress={openModelPicker} disabled={loadingModels}>
          <Text style={{ color: isDark ? '#fff' : '#000' }}>{model}</Text>
          {loadingModels ? <ActivityIndicator size="small" color="#007AFF" /> : <Text style={styles.changeText}>Change</Text>}
        </TouchableOpacity>
      </View>

      <SelectModal
        visible={modelPickerVisible}
        title="Choose a model"
        options={modelOptions}
        selectedId={model}
        isDark={isDark}
        onSelect={(id) => {
          setModel(id);
          setModelPickerVisible(false);
        }}
        onCancel={() => setModelPickerVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  card: { borderRadius: 12, padding: 16 },
  notice: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '500' },
  hint: { fontSize: 12, marginTop: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginTop: 8 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  primaryButton: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  secondaryButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#007AFF' },
  secondaryButtonText: { color: '#007AFF', fontWeight: '600', fontSize: 14 },
  removeKeyText: { color: '#ff3b30', fontSize: 13, marginTop: 10 },
  modelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginTop: 8 },
  changeText: { color: '#007AFF', fontSize: 13, fontWeight: '600' },
});
