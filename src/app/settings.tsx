import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack } from 'expo-router';
import { useGroqSettings } from '../hooks/useGroqSettings';
import { listModels, GroqError } from '../lib/llm/groq';
import { SelectModal } from '../components/SelectModal';
import { useTheme, type ThemePreference } from '../contexts/ThemeContext';
import { useAppLock } from '../contexts/AppLockContext';
import { useGoogleDriveSync } from '../hooks/useGoogleDriveSync';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function errorMessage(e: unknown): string {
  if (e instanceof GroqError) return e.message;
  return 'Something went wrong.';
}

export default function SettingsScreen() {
  const { isDark, preference, setPreference } = useTheme();
  const { loaded, apiKey, setApiKey, model, setModel, aiEnabled, setAiEnabled } = useGroqSettings();
  const { enabled: appLockEnabled, setEnabled: setAppLockEnabled } = useAppLock();
  const { signedIn, userEmail, isBusy, lastBackupAt, connect, disconnect, backupNow, restoreNow } = useGoogleDriveSync();

  const handleToggleAppLock = async (next: boolean) => {
    const applied = await setAppLockEnabled(next);
    if (!applied) {
      Alert.alert('Not available', 'Set up a fingerprint, face unlock, or screen lock in your device settings first.');
    }
  };

  const handleConnectDrive = async () => {
    try {
      await connect();
    } catch (e: any) {
      Alert.alert('Could not connect', e.message || 'Something went wrong.');
    }
  };

  const handleBackup = async () => {
    try {
      await backupNow();
      Alert.alert('Backed up', 'Your favorites, recents, and preferences were saved to Google Drive.');
    } catch (e: any) {
      Alert.alert('Backup failed', e.message || 'Something went wrong.');
    }
  };

  const handleRestore = () => {
    Alert.alert(
      'Restore from Drive?',
      'This replaces your current favorites, recents, and preferences on this device with the ones from your last backup. A restart is needed afterwards for every screen to pick up the change.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            try {
              const found = await restoreNow();
              Alert.alert(
                found ? 'Restored' : 'No backup found',
                found ? 'Restart the app for the restored data to appear everywhere.' : 'Back up from another device first.'
              );
            } catch (e: any) {
              Alert.alert('Restore failed', e.message || 'Something went wrong.');
            }
          },
        },
      ]
    );
  };

  const [keyDraft, setKeyDraft] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(!apiKey);
  const [testing, setTesting] = useState(false);
  const [modelPickerVisible, setModelPickerVisible] = useState(false);
  const [modelOptions, setModelOptions] = useState<{ id: string; label: string }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const effectiveKey = keyDraft || apiKey || '';

  const handleSaveKey = async () => {
    try {
      await setApiKey(keyDraft);
      setKeyDraft('');
      setIsEditingKey(false);
      Alert.alert('Saved', 'API key saved. It stays on this device until you remove it here or delete the app.');
    } catch {
      Alert.alert('Could not save key', 'Something went wrong saving the key to this device. Please try again.');
    }
  };

  const handleCancelEditKey = () => {
    setKeyDraft('');
    setIsEditingKey(false);
  };

  const handleRemoveKey = () => {
    Alert.alert('Remove API key?', 'AI features will turn off until you add a key again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await setApiKey('');
            setIsEditingKey(true);
          } catch {
            Alert.alert('Could not remove key', 'Something went wrong. Please try again.');
          }
        },
      },
    ]);
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
      <View style={[styles.container, styles.center, { backgroundColor: isDark ? '#0a0a0c' : '#f5f5f5' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDark ? '#0a0a0c' : '#f5f5f5' }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Settings' }} />

      <Text style={[styles.sectionTitle, { color: isDark ? '#aaa' : '#666' }]}>APPEARANCE</Text>
      <View style={[styles.card, { backgroundColor: isDark ? '#17171a' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>Theme</Text>
        <View style={[styles.segmented, { borderColor: isDark ? '#444' : '#ccc' }]}>
          {THEME_OPTIONS.map((option) => {
            const selected = preference === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.segment, selected && styles.segmentSelected]}
                onPress={() => setPreference(option.value)}
              >
                <Text style={{ color: selected ? '#fff' : (isDark ? '#ccc' : '#444'), fontWeight: selected ? '600' : '400' }}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: isDark ? '#aaa' : '#666', marginTop: 20 }]}>AI FEATURES (GROQ)</Text>
      <View style={[styles.card, { backgroundColor: isDark ? '#17171a' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
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

        <View style={styles.keyLabelRow}>
          <Text style={[styles.label, { color: isDark ? '#fff' : '#000', marginTop: 16 }]}>Groq API key</Text>
          <TouchableOpacity
            style={{ marginTop: 16 }}
            onPress={() => Linking.openURL('https://console.groq.com/keys')}
          >
            <Text style={styles.getKeyLink}>New to Groq? Get a free API key →</Text>
          </TouchableOpacity>
        </View>

        {apiKey && !isEditingKey ? (
          <View style={[styles.savedKeyRow, { borderColor: isDark ? '#444' : '#ccc' }]}>
            <Text style={{ color: isDark ? '#aaa' : '#666', fontSize: 14, flex: 1, marginRight: 10 }} numberOfLines={1}>
              •••••••••••••••••• (saved)
            </Text>
            <View style={styles.savedKeyActions}>
              <TouchableOpacity onPress={() => setIsEditingKey(true)} hitSlop={8}>
                <Text style={styles.changeText}>Change</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRemoveKey} hitSlop={8}>
                <Text style={styles.removeInlineText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <TextInput
              autoFocus={!!apiKey}
              value={keyDraft}
              onChangeText={setKeyDraft}
              placeholder="gsk_..."
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
              <TouchableOpacity onPress={handleCancelEditKey}>
                <Text style={[styles.hint, { marginTop: 10, color: isDark ? '#aaa' : '#666' }]}>Cancel</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        <Text style={[styles.label, { color: isDark ? '#fff' : '#000', marginTop: 16 }]}>Model</Text>
        <TouchableOpacity style={[styles.modelRow, { borderColor: isDark ? '#444' : '#ccc' }]} onPress={openModelPicker} disabled={loadingModels}>
          <Text style={{ color: isDark ? '#fff' : '#000' }}>{model}</Text>
          {loadingModels ? <ActivityIndicator size="small" color="#007AFF" /> : <Text style={styles.changeText}>Change</Text>}
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: isDark ? '#aaa' : '#666', marginTop: 20 }]}>SECURITY</Text>
      <View style={[styles.card, { backgroundColor: isDark ? '#17171a' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>Require unlock to open app</Text>
          <Switch value={appLockEnabled} onValueChange={handleToggleAppLock} />
        </View>
        <Text style={[styles.hint, { color: isDark ? '#777' : '#999' }]}>
          Uses your device&rsquo;s fingerprint, face unlock, or screen lock.
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: isDark ? '#aaa' : '#666', marginTop: 20 }]}>BACKUP &amp; SYNC</Text>
      <View style={[styles.card, { backgroundColor: isDark ? '#17171a' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
        <Text style={[styles.notice, { color: isDark ? '#aaa' : '#666' }]}>
          Back up your favorites, recents, and preferences to your own Google Drive (in a private
          app-only folder, not visible among your regular files), and restore them on another
          device. Your Groq API key is never included.
        </Text>

        {!signedIn ? (
          <TouchableOpacity style={styles.primaryButton} onPress={handleConnectDrive} disabled={isBusy}>
            {isBusy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryButtonText}>Connect Google Drive</Text>}
          </TouchableOpacity>
        ) : (
          <>
            <Text style={[styles.label, { color: isDark ? '#fff' : '#000' }]}>{userEmail}</Text>
            {lastBackupAt && (
              <Text style={[styles.hint, { color: isDark ? '#777' : '#999' }]}>
                Last backed up {new Date(lastBackupAt).toLocaleString()}
              </Text>
            )}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleRestore} disabled={isBusy}>
                <Text style={styles.secondaryButtonText}>Restore</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryButton} onPress={handleBackup} disabled={isBusy}>
                {isBusy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.primaryButtonText}>Back up now</Text>}
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={disconnect} disabled={isBusy}>
              <Text style={styles.removeKeyText}>Disconnect</Text>
            </TouchableOpacity>
          </>
        )}
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
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  notice: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 15, fontWeight: '500' },
  segmented: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, overflow: 'hidden', marginTop: 10 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  segmentSelected: { backgroundColor: '#007AFF' },
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
  keyLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  getKeyLink: { color: '#007AFF', fontSize: 12, fontWeight: '600' },
  savedKeyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  savedKeyActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  removeInlineText: { color: '#ff3b30', fontSize: 13, fontWeight: '600' },
});
