import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useColorScheme, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { StorageProvider } from '../lib/storage/StorageProvider';
import { useDirectory } from '../hooks/useDirectory';
import { useRecents, type RecentFile } from '../hooks/useRecents';
import { useFavorites, type FavoriteEntry } from '../hooks/useFavorites';
import { getDisplayName, getFileIcon, isLikelyFile } from '../lib/fileKind';
import { QuickAccessSection } from '../components/QuickAccessSection';

export default function HomeScreen() {
  const [rootUri, setRootUri] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { files } = useDirectory(rootUri);
  const { recents, addRecent } = useRecents();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const openFile = useCallback(async (uri: string, name: string) => {
    addRecent(uri, name);
    await AsyncStorage.setItem('current_file_uri', uri);
    await AsyncStorage.setItem('last_opened_screen', 'viewer');
    router.push({ pathname: '/viewer', params: { name } });
  }, [addRecent]);

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

      // If they closed the app while viewing a file, reopen it automatically
      if (lastScreen === 'viewer') {
        const fileUri = await AsyncStorage.getItem('current_file_uri');
        if (fileUri) {
          router.push({
            pathname: '/viewer',
            params: { name: getDisplayName(fileUri) }
          });
        }
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

  useEffect(() => {
    const onBackPress = () => {
      if (history.length > 0) {
        goBack();
        return true; // Prevent default back (which closes the app)
      }
      return false; // Allow default back (close app) if at root folder
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [history, goBack]);

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

      const newHistory = [...history, rootUri!];
      setHistory(newHistory);
      setRootUri(itemUri);

      await AsyncStorage.setItem('opener_history', JSON.stringify(newHistory));
      await AsyncStorage.setItem('opener_current_folder', itemUri);
      await AsyncStorage.setItem('last_opened_screen', 'index');
    } catch {
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

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: isDark ? '#fff' : '#000' }}>
              <Text style={{ color: '#3498db' }}>O</Text>pener
            </Text>
          )
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
            {history.length > 0 && (
              <TouchableOpacity onPress={goBack} style={styles.backBtn}>
                <MaterialIcons name="arrow-back" size={20} color={isDark ? '#ccc' : '#444'} />
              </TouchableOpacity>
            )}
            <Text style={[styles.pathText, { color: isDark ? '#ccc' : '#444', marginLeft: history.length > 0 ? 10 : 0 }]} numberOfLines={1}>
              {getDisplayName(rootUri)}
            </Text>
            <TouchableOpacity onPress={selectDirectory}>
              <Text style={styles.changeText}>Change Root</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={files}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const filename = getDisplayName(item);
              const { icon, color } = getFileIcon(filename, isDark);
              const pinned = isFavorite(item);

              return (
                <TouchableOpacity
                  style={[styles.fileItem, { borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}
                  onPress={() => handleItemPress(item, filename)}
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
  changeText: { color: '#007AFF', fontSize: 14, fontWeight: '600' },
  fileItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
  icon: { marginRight: 15 },
  fileText: { flex: 1, fontSize: 16, marginRight: 10 },
});
