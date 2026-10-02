import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_GROQ_MODEL } from '../lib/llm/groq';

const SECURE_API_KEY = 'opener_groq_api_key';
const MODEL_KEY = 'opener_groq_model';
const AI_ENABLED_KEY = 'opener_ai_enabled';

/** Groq settings: API key lives in SecureStore, model/enabled are plain AsyncStorage prefs. */
export function useGroqSettings() {
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [model, setModelState] = useState<string>(DEFAULT_GROQ_MODEL);
  const [aiEnabled, setAiEnabledState] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [key, savedModel, savedEnabled] = await Promise.all([
        SecureStore.getItemAsync(SECURE_API_KEY),
        AsyncStorage.getItem(MODEL_KEY),
        AsyncStorage.getItem(AI_ENABLED_KEY),
      ]);
      if (key) setApiKeyState(key);
      if (savedModel) setModelState(savedModel);
      setAiEnabledState(savedEnabled === 'true');
      setLoaded(true);
    })();
  }, []);

  const setApiKey = useCallback(async (key: string) => {
    const trimmed = key.trim();
    setApiKeyState(trimmed || null);
    if (trimmed) await SecureStore.setItemAsync(SECURE_API_KEY, trimmed);
    else await SecureStore.deleteItemAsync(SECURE_API_KEY);
  }, []);

  const setModel = useCallback(async (newModel: string) => {
    setModelState(newModel);
    await AsyncStorage.setItem(MODEL_KEY, newModel);
  }, []);

  const setAiEnabled = useCallback(async (enabled: boolean) => {
    setAiEnabledState(enabled);
    await AsyncStorage.setItem(AI_ENABLED_KEY, String(enabled));
  }, []);

  return { loaded, apiKey, setApiKey, model, setModel, aiEnabled, setAiEnabled };
}
