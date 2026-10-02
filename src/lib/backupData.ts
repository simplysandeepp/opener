import AsyncStorage from '@react-native-async-storage/async-storage';

// Deliberately excludes the Groq API key (secret) and the app-lock flag
// (restoring "locked" onto a device with no biometric/passcode enrollment
// could leave the app unopenable).
const BACKUP_KEYS = ['opener_favorites', 'opener_recents', 'opener_theme_preference', 'opener_groq_model', 'opener_ai_enabled'] as const;

export interface BackupData {
  version: 1;
  exportedAt: number;
  values: Partial<Record<(typeof BACKUP_KEYS)[number], string>>;
}

export async function collectBackupData(): Promise<BackupData> {
  const entries = await AsyncStorage.multiGet(BACKUP_KEYS);
  const values: BackupData['values'] = {};
  for (const [key, value] of entries) {
    if (value !== null) values[key as (typeof BACKUP_KEYS)[number]] = value;
  }
  return { version: 1, exportedAt: Date.now(), values };
}

export async function applyBackupData(backup: BackupData): Promise<void> {
  const pairs = Object.entries(backup.values) as [string, string][];
  if (pairs.length > 0) await AsyncStorage.multiSet(pairs);
}
