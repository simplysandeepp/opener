import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { collectBackupData, applyBackupData, type BackupData } from '../lib/backupData';
import { findBackupFile, uploadBackup, downloadBackup } from '../lib/googleDrive';

const LAST_BACKUP_KEY = 'opener_drive_last_backup_at';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';

GoogleSignin.configure({ scopes: [DRIVE_SCOPE] });

export function useGoogleDriveSync() {
  const [signedIn, setSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(LAST_BACKUP_KEY);
      if (saved) setLastBackupAt(Number(saved));

      if (GoogleSignin.hasPreviousSignIn()) {
        try {
          const result = await GoogleSignin.signInSilently();
          if (result.type === 'success') {
            setSignedIn(true);
            setUserEmail(result.data.user.email);
          }
        } catch {
          // Stale/expired session; user will need to tap Connect again.
        }
      }
    })();
  }, []);

  const connect = useCallback(async () => {
    await GoogleSignin.hasPlayServices();
    const result = await GoogleSignin.signIn();
    if (result.type === 'success') {
      setSignedIn(true);
      setUserEmail(result.data.user.email);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await GoogleSignin.signOut();
    setSignedIn(false);
    setUserEmail(null);
  }, []);

  const getAccessToken = useCallback(async (): Promise<string> => {
    await GoogleSignin.signInSilently();
    const { accessToken } = await GoogleSignin.getTokens();
    return accessToken;
  }, []);

  const backupNow = useCallback(async () => {
    setIsBusy(true);
    try {
      const accessToken = await getAccessToken();
      const data = await collectBackupData();
      const existingFileId = await findBackupFile(accessToken);
      await uploadBackup(accessToken, data, existingFileId);
      const now = Date.now();
      setLastBackupAt(now);
      await AsyncStorage.setItem(LAST_BACKUP_KEY, String(now));
    } finally {
      setIsBusy(false);
    }
  }, [getAccessToken]);

  /** Returns true if a backup was found and applied; false if there was nothing to restore. */
  const restoreNow = useCallback(async (): Promise<boolean> => {
    setIsBusy(true);
    try {
      const accessToken = await getAccessToken();
      const fileId = await findBackupFile(accessToken);
      if (!fileId) return false;
      const backup = await downloadBackup<BackupData>(accessToken, fileId);
      await applyBackupData(backup);
      return true;
    } finally {
      setIsBusy(false);
    }
  }, [getAccessToken]);

  return { signedIn, userEmail, isBusy, lastBackupAt, connect, disconnect, backupNow, restoreNow };
}
