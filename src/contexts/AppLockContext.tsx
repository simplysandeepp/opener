import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { LockScreen } from '../components/LockScreen';

const STORAGE_KEY = 'opener_app_lock_enabled';

interface AppLockContextValue {
  enabled: boolean;
  /** Resolves to false (without changing anything) if the device has no usable biometric/passcode enrollment. */
  setEnabled: (enabled: boolean) => Promise<boolean>;
}

const AppLockContext = createContext<AppLockContextValue | null>(null);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [enabled, setEnabledState] = useState(false);
  const [locked, setLocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      const isEnabled = saved === 'true';
      setEnabledState(isEnabled);
      setLocked(isEnabled);
      setLoaded(true);
    });
  }, []);

  const attemptUnlock = useCallback(async () => {
    setAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock Opener' });
      if (result.success) setLocked(false);
    } finally {
      setAuthenticating(false);
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current === 'active' && nextState !== 'active' && enabled) {
        setLocked(true);
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, [enabled]);

  const setEnabled = useCallback(async (next: boolean) => {
    if (next) {
      const [hasHardware, isEnrolled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      if (!hasHardware || !isEnrolled) return false;
    }
    setEnabledState(next);
    setLocked(false);
    await AsyncStorage.setItem(STORAGE_KEY, String(next));
    return true;
  }, []);

  if (!loaded) return null;

  if (enabled && locked) {
    return <LockScreen onUnlock={attemptUnlock} authenticating={authenticating} />;
  }

  return <AppLockContext.Provider value={{ enabled, setEnabled }}>{children}</AppLockContext.Provider>;
}

export function useAppLock(): AppLockContextValue {
  const ctx = useContext(AppLockContext);
  if (!ctx) throw new Error('useAppLock must be used within an AppLockProvider');
  return ctx;
}
