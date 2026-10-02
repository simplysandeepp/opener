import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, TouchableOpacity, FlatList, BackHandler, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { StorageProvider } from '../lib/storage/StorageProvider';
import { createNewFile, createNewFolder, deleteEntry, duplicateFile, renameFile } from '../lib/fileOps';
import { useDirectory } from '../hooks/useDirectory';
import { useRecents, type RecentFile } from '../hooks/useRecents';
import { useFavorites, type FavoriteEntry } from '../hooks/useFavorites';
import { useSearch } from '../hooks/useSearch';
import { getDisplayName, getFileIcon, isLikelyFile } from '../lib/fileKind';
import { QuickAccessSection } from '../components/QuickAccessSection';
import { PromptModal } from '../components/PromptModal';
import { FolderRagSheet } from '../components/FolderRagSheet';
import { useTheme } from '../contexts/ThemeContext';
import { useTabs } from '../contexts/TabsContext';
import { useGroqSettings } from '../hooks/useGroqSettings';

type Prompt =
  | { type: 'newFile' }
  | { type: 'newFolder' }
  | { type: 'rename'; uri: string; name: string };

export default function HomeScreen() {
  const [rootUri, setRootUri] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [ragVisible, setRagVisible] = useState(false);
  const { isDark } = useTheme();
  const { tabs, openTab } = useTabs();
  const { apiKey, model, aiEnabled } = useGroqSettings();
  // Read inside a once-only mount effect without making it re-run as tabs changes during the session.
  const tabsRef = useRef(tabs);
  useEffect(() => {
    tabsRef.current = tabs;
  });

  const { files, refresh: refreshDirectory } = useDirectory(rootUri);
  const { recents, addRecent } = useRecents();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();
  const {
    query,
    setQuery,
    localResults,
    recursiveResults,
    isSearching,
    searchEverywhere,
    cancelSearch,
    resetSearch,
  } = useSearch(rootUri, files);

  const openFile = useCallback((uri: string, name: string) => {
    addRecent(uri, name);
    openTab(uri, name);
    router.push('/viewer');
  }, [addRecent, openTab]);

  const openFolder = useCallback(async (uri: string) => {
    setHistory([]);
    setRootUri(uri);
    await AsyncStorage.setItem('opener_current_folder', uri);
    await AsyncStorage.setItem('opener_history', JSON.stringify([]));
    await AsyncStorage.setItem('last_opened_screen', 'index');
  }, []);

  const loadSavedDirectory = useCallback(async () => {
    try {
      const savedRoot = await AsyncStorage.getItem('opener_root_uri');
      const savedFolder = await AsyncStorage.getItem('opener_current_folder');
      const savedHistory = await AsyncStorage.getItem('opener_history');
      const lastScreen = await AsyncStorage.getItem('last_opened_screen');

      if (savedFolder && savedRoot) {
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        setRootUri(savedFolder);
      } else if (savedRoot) {
        setRootUri(savedRoot);
      }

      // If they closed the app while viewing a file, reopen the viewer with its open tabs
      if (lastScreen === 'viewer' && tabsRef.current.length > 0) {
        router.push('/viewer');
      }
    } catch (e) {
      console.warn('Failed to load saved directory', e);
    }
  }, []);

  useEffect(() => {
    loadSavedDirectory();
  }, [loadSavedDirectory]);

  const goBack = useCallback(async () => {
    if (history.length > 0) {
      const newHistory = [...history];
      const previousUri = newHistory.pop()!;
      setHistory(newHistory);
      setRootUri(previousUri);
      await AsyncStorage.setItem('opener_history', JSON.stringify(newHistory));
      await AsyncStorage.setItem('opener_current_folder', previousUri);
      await AsyncStorage.setItem('last_opened_screen', 'index');
    }
  }, [history]);

  const closeSearch = useCallback(() => {
    resetSearch();
    setShowSearch(false);
  }, [resetSearch]);

  useEffect(() => {
    const onBackPress = () => {
      if (showSearch) {
        closeSearch();
        return true;
      }
      if (history.length > 0) {
        goBack();
        return true; // Prevent default back (which closes the app)
      }
      return false; // Allow default back (close app) if at root folder
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [history, goBack, showSearch, closeSearch]);

  const selectDirectory = async () => {
    try {
      const uri = await StorageProvider.requestDirectoryPermission();
      if (uri) {
        await AsyncStorage.setItem('opener_root_uri', uri);
        setRootUri(uri);
        setHistory([]); // Reset history when picking a new root
      }
    } catch (e) {
      console.warn('Failed to select directory', e);
    }
  };

  const handleItemPress = async (itemUri: string, filename: string) => {
    try {
      const isFolder = await StorageProvider.isDirectory(itemUri);
      if (!isFolder) throw new Error('Not a directory');

      closeSearch();
      const newHistory = [...history, rootUri!];
      setHistory(newHistory);
      setRootUri(itemUri);

      await AsyncStorage.setItem('opener_history', JSON.stringify(newHistory));
      await AsyncStorage.setItem('opener_current_folder', itemUri);
      await AsyncStorage.setItem('last_opened_screen', 'index');
    } catch {
      closeSearch();
      openFile(itemUri, filename);
    }
  };

  const handleOpenFavorite = (entry: FavoriteEntry) => {
    if (entry.isFolder) openFolder(entry.uri);
    else openFile(entry.uri, entry.name);
  };

  const handleOpenRecent = (entry: RecentFile) => {
    openFile(entry.uri, entry.name);
  };

  const forgetFavorite = useCallback((uri: string) => {
    if (isFavorite(uri)) toggleFavorite({ uri, name: '', isFolder: false });
  }, [isFavorite, toggleFavorite]);

  const handleDelete = (itemUri: string, filename: string) => {
    Alert.alert('Delete', `Delete "${filename}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEntry(itemUri);
            forgetFavorite(itemUri);
            refreshDirectory();
          } catch (e: any) {
            Alert.alert('Error', `Could not delete "${filename}". ${e.message || ''}`);
          }
        },
      },
    ]);
  };

  const handleDuplicate = async (itemUri: string, filename: string) => {
    try {
      await duplicateFile(itemUri, rootUri!);
      refreshDirectory();
    } catch (e: any) {
      Alert.alert('Error', `Could not duplicate "${filename}". ${e.message || ''}`);
    }
  };

  const handleLongPress = (itemUri: string, filename: string) => {
    const isFile = isLikelyFile(filename);
    const options: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[] = [];

    if (isFile) {
      options.push({ text: 'Rename', onPress: () => setPrompt({ type: 'rename', uri: itemUri, name: filename }) });
      options.push({ text: 'Duplicate', onPress: () => handleDuplicate(itemUri, filename) });
    }
    options.push({ text: 'Delete', style: 'destructive', onPress: () => handleDelete(itemUri, filename) });
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(filename, undefined, options);
  };

  const handleAddPress = () => {
    Alert.alert('New', undefined, [
      { text: 'New File', onPress: () => setPrompt({ type: 'newFile' }) },
      { text: 'New Folder', onPress: () => setPrompt({ type: 'newFolder' }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePromptSubmit = async (value: string) => {
    if (!prompt || !rootUri || !value) {
      setPrompt(null);
      return;
    }
    const activePrompt = prompt;
    setPrompt(null);

    try {
      if (activePrompt.type === 'newFile') {
        await createNewFile(rootUri, value);
      } else if (activePrompt.type === 'newFolder') {
        await createNewFolder(rootUri, value);
      } else {
        await renameFile(activePrompt.uri, rootUri, value);
        forgetFavorite(activePrompt.uri);
      }
      refreshDirectory();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong.');
    }
  };

  const isSearchingQuery = query.length > 0;
  const displayedItems = isSearchingQuery ? (recursiveResults ?? localResults).map((r) => r.uri) : files;

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#fff' : '#000' }}>
              <Text style={{ color: '#3498db' }}>O</Text>pener
            </Text>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/settings')} hitSlop={10} style={{ marginRight: 15 }}>
              <MaterialIcons name="settings" size={22} color={isDark ? '#ccc' : '#444'} />
            </TouchableOpacity>
          ),
        }}
      />
      <QuickAccessSection
        favorites={favorites}
        recents={recents}
        isDark={isDark}
        onOpenFavorite={handleOpenFavorite}
        onOpenRecent={handleOpenRecent}
      />
      {!rootUri ? (
        <View style={styles.emptyState}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>
            Welcome to Opener
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#aaa' : '#666' }]}>
            Select a folder to view your files locally.
          </Text>
          <TouchableOpacity style={styles.button} onPress={selectDirectory}>
            <Text style={styles.buttonText}>Select Folder</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <View style={[styles.headerRow, { backgroundColor: isDark ? '#1e1e1e' : '#eaeaea' }]}>
            {showSearch ? (
              <>
                <MaterialIcons name="search" size={20} color={isDark ? '#ccc' : '#444'} />
                <TextInput
                  autoFocus
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search this folder..."
                  placeholderTextColor={isDark ? '#777' : '#999'}
                  style={[styles.searchInput, { color: isDark ? '#fff' : '#000' }]}
                />
                <TouchableOpacity onPress={closeSearch} hitSlop={10}>
                  <MaterialIcons name="close" size={20} color={isDark ? '#ccc' : '#444'} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                {history.length > 0 && (
                  <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                    <MaterialIcons name="arrow-back" size={20} color={isDark ? '#ccc' : '#444'} />
                  </TouchableOpacity>
                )}
                <Text style={[styles.pathText, { color: isDark ? '#ccc' : '#444', marginLeft: history.length > 0 ? 10 : 0 }]} numberOfLines={1}>
                  {getDisplayName(rootUri)}
                </Text>
                <TouchableOpacity onPress={handleAddPress} hitSlop={10} style={styles.searchBtn}>
                  <MaterialIcons name="add" size={22} color={isDark ? '#ccc' : '#444'} />
                </TouchableOpacity>
                {aiEnabled && (
                  <TouchableOpacity onPress={() => setRagVisible(true)} hitSlop={10} style={styles.searchBtn}>
                    <MaterialIcons name="auto-awesome" size={19} color={isDark ? '#ccc' : '#444'} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowSearch(true)} hitSlop={10} style={styles.searchBtn}>
                  <MaterialIcons name="search" size={20} color={isDark ? '#ccc' : '#444'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={selectDirectory}>
                  <Text style={styles.changeText}>Change Root</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          {isSearchingQuery && !isSearching && recursiveResults === null && (
            <TouchableOpacity style={styles.searchEverywhereBtn} onPress={searchEverywhere}>
              <MaterialIcons name="travel-explore" size={16} color="#007AFF" />
              <Text style={styles.searchEverywhereText}>Search in all subfolders</Text>
            </TouchableOpacity>
          )}
          {isSearchingQuery && isSearching && (
            <View style={styles.searchEverywhereBtn}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={[styles.searchEverywhereText, { marginLeft: 8 }]}>Searching subfolders...</Text>
              <TouchableOpacity onPress={cancelSearch} style={{ marginLeft: 12 }}>
                <Text style={{ color: '#ff3b30', fontSize: 13 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          {isSearchingQuery && recursiveResults !== null && (
            <Text style={[styles.resultCount, { color: isDark ? '#aaa' : '#666' }]}>
              {recursiveResults.length} result{recursiveResults.length === 1 ? '' : 's'} found
            </Text>
          )}
          <FlatList
            data={displayedItems}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const filename = getDisplayName(item);
              const { icon, color } = getFileIcon(filename, isDark);
              const pinned = isFavorite(item);

              return (
                <TouchableOpacity
                  style={[styles.fileItem, { borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}
                  onPress={() => handleItemPress(item, filename)}
                  onLongPress={() => handleLongPress(item, filename)}
                >
                  <MaterialIcons name={icon as any} size={24} color={color} style={styles.icon} />
                  <Text style={[styles.fileText, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>{filename}</Text>
                  <TouchableOpacity
                    hitSlop={10}
                    onPress={() => toggleFavorite({ uri: item, name: filename, isFolder: !isLikelyFile(filename) })}
                  >
                    <MaterialIcons name={pinned ? 'star' : 'star-border'} size={20} color={pinned ? '#f9a825' : (isDark ? '#666' : '#aaa')} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
      <PromptModal
        visible={prompt !== null}
        isDark={isDark}
        title={
          prompt?.type === 'newFile' ? 'New File'
            : prompt?.type === 'newFolder' ? 'New Folder'
            : 'Rename'
        }
        initialValue={prompt?.type === 'rename' ? prompt.name : ''}
        placeholder={prompt?.type === 'newFolder' ? 'Folder name' : 'file-name.ext'}
        confirmLabel={prompt?.type === 'rename' ? 'Rename' : 'Create'}
        onCancel={() => setPrompt(null)}
        onSubmit={handlePromptSubmit}
      />
      {rootUri && (
        <FolderRagSheet
          visible={ragVisible}
          onClose={() => setRagVisible(false)}
          isDark={isDark}
          folderUri={rootUri}
          folderName={getDisplayName(rootUri)}
          apiKey={apiKey}
          model={model}
          onOpenSource={openFile}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 30 },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  listContainer: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  backBtn: { padding: 4 },
  pathText: { flex: 1, fontSize: 14, fontWeight: '600', marginRight: 10 },
  searchBtn: { marginRight: 15 },
  searchInput: { flex: 1, fontSize: 14, marginHorizontal: 10, padding: 0 },
  changeText: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  fileItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
  icon: { marginRight: 15 },
  fileText: { flex: 1, fontSize: 16, marginRight: 10 },
  searchEverywhereBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10 },
  searchEverywhereText: { color: '#007AFF', fontSize: 13, marginLeft: 6 },
  resultCount: { paddingHorizontal: 15, paddingBottom: 8, fontSize: 12 },
});
