import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TABS_KEY = 'opener_open_tabs';
const ACTIVE_KEY = 'opener_active_tab';
const MAX_TABS = 8;

export interface OpenTab {
  uri: string;
  name: string;
}

interface TabsContextValue {
  tabs: OpenTab[];
  activeUri: string | null;
  /** uri -> has unsaved edits, reported by each open tab's view. */
  dirty: Record<string, boolean>;
  openTab: (uri: string, name: string) => void;
  closeTab: (uri: string) => void;
  setActiveTab: (uri: string) => void;
  setTabDirty: (uri: string, isDirty: boolean) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

export function TabsProvider({ children }: { children: React.ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [activeUri, setActiveUriState] = useState<string | null>(null);
  const [dirty, setDirty] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const [savedTabs, savedActive] = await Promise.all([
        AsyncStorage.getItem(TABS_KEY),
        AsyncStorage.getItem(ACTIVE_KEY),
      ]);
      if (savedTabs) setTabs(JSON.parse(savedTabs));
      if (savedActive) setActiveUriState(savedActive);
      setLoaded(true);
    })();
  }, []);

  const persist = useCallback((nextTabs: OpenTab[], nextActive: string | null) => {
    AsyncStorage.setItem(TABS_KEY, JSON.stringify(nextTabs));
    if (nextActive) AsyncStorage.setItem(ACTIVE_KEY, nextActive);
    else AsyncStorage.removeItem(ACTIVE_KEY);
  }, []);

  const openTab = useCallback((uri: string, name: string) => {
    const exists = tabs.some((t) => t.uri === uri);
    const nextTabs = exists ? tabs : [...tabs, { uri, name }].slice(-MAX_TABS);
    setTabs(nextTabs);
    setActiveUriState(uri);
    persist(nextTabs, uri);
  }, [tabs, persist]);

  const setActiveTab = useCallback((uri: string) => {
    setActiveUriState(uri);
    AsyncStorage.setItem(ACTIVE_KEY, uri);
  }, []);

  const closeTab = useCallback((uri: string) => {
    const index = tabs.findIndex((t) => t.uri === uri);
    if (index === -1) return;
    const nextTabs = tabs.filter((t) => t.uri !== uri);
    const nextActive = activeUri === uri ? (nextTabs[Math.max(0, index - 1)]?.uri ?? null) : activeUri;

    setTabs(nextTabs);
    setActiveUriState(nextActive);
    setDirty((prev) => {
      if (!(uri in prev)) return prev;
      const { [uri]: _removed, ...rest } = prev;
      return rest;
    });
    persist(nextTabs, nextActive);
  }, [tabs, activeUri, persist]);

  const setTabDirty = useCallback((uri: string, isDirty: boolean) => {
    setDirty((prev) => (prev[uri] === isDirty ? prev : { ...prev, [uri]: isDirty }));
  }, []);

  const value = useMemo(
    () => ({ tabs, activeUri, dirty, openTab, closeTab, setActiveTab, setTabDirty }),
    [tabs, activeUri, dirty, openTab, closeTab, setActiveTab, setTabDirty]
  );

  if (!loaded) return null;

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

export function useTabs(): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('useTabs must be used within a TabsProvider');
  return ctx;
}
