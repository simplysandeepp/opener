import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useColorScheme } from 'react-native';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

export default function HomeScreen() {
  const [rootUri, setRootUri] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    loadSavedDirectory();
  }, []);

  const loadSavedDirectory = async () => {
    try {
      const savedRoot = await AsyncStorage.getItem('opener_root_uri');
      const savedFolder = await AsyncStorage.getItem('opener_current_folder');
      const savedHistory = await AsyncStorage.getItem('opener_history');
      const lastScreen = await AsyncStorage.getItem('last_opened_screen');
      
      if (savedFolder && savedRoot) {
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        setRootUri(savedFolder);
        readDirectory(savedFolder);
      } else if (savedRoot) {
        setRootUri(savedRoot);
        readDirectory(savedRoot);
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
  };

  const selectDirectory = async () => {
    try {
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions.granted) {
        const uri = permissions.directoryUri;
        await AsyncStorage.setItem('opener_root_uri', uri);
        setRootUri(uri);
        setHistory([]); // Reset history when picking a new root
        readDirectory(uri);
      }
    } catch (e) {
      console.warn('Failed to select directory', e);
    }
  };

  const getFileInfo = (filename: string, isDark: boolean) => {
    if (!filename.includes('.')) return { isFile: false, icon: 'folder', color: '#fbc02d' };
    
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    switch(ext) {
      case 'html': 
      case 'htm': 
        return { isFile: true, icon: 'language', color: '#e44d26' }; // HTML5 Orange
      case 'md': 
      case 'markdown': 
        return { isFile: true, icon: 'article', color: isDark ? '#fff' : '#333' }; 
      case 'txt': 
        return { isFile: true, icon: 'text-snippet', color: '#9e9e9e' };
      case 'csv': 
        return { isFile: true, icon: 'table-chart', color: '#4caf50' };
      default:
        // If extension is 1-4 chars, assume file, else folder (e.g., v1.0.0 might be a folder)
        if (ext.length > 0 && ext.length <= 4 && !/\d/.test(ext)) {
           return { isFile: true, icon: 'insert-drive-file', color: isDark ? '#aaa' : '#666' };
        }
        return { isFile: false, icon: 'folder', color: '#fbc02d' };
    }
  };

  const readDirectory = async (uri: string) => {
    try {
      const filesInDir = await StorageAccessFramework.readDirectoryAsync(uri);
      
      filesInDir.sort((a, b) => {
        const nameA = getDisplayName(a);
        const nameB = getDisplayName(b);
        const infoA = getFileInfo(nameA, isDark);
        const infoB = getFileInfo(nameB, isDark);
        
        if (infoA.isFile === infoB.isFile) return nameA.localeCompare(nameB);
        return infoA.isFile ? 1 : -1;
      });
      setFiles(filesInDir);
    } catch (e) {
      console.warn('Failed to read directory', e);
    }
  };

  const goBack = async () => {
    if (history.length > 0) {
      const newHistory = [...history];
      const previousUri = newHistory.pop()!;
      setHistory(newHistory);
      setRootUri(previousUri);
      await AsyncStorage.setItem('opener_history', JSON.stringify(newHistory));
      await AsyncStorage.setItem('opener_current_folder', previousUri);
      await AsyncStorage.setItem('last_opened_screen', 'index');
      readDirectory(previousUri);
    }
  };

  const getDisplayName = (uri: string) => {
    try {
      const decoded = decodeURIComponent(uri);
      const parts = decoded.split('/');
      let lastPart = parts.pop() || decoded;
      if (lastPart.includes(':')) {
        lastPart = lastPart.split(':').pop() || lastPart;
      }
      return lastPart || 'Selected Folder';
    } catch {
      return 'Selected Folder';
    }
  };

  const handleItemPress = async (itemUri: string, filename: string, isFileGuess: boolean) => {
    try {
      await StorageAccessFramework.readDirectoryAsync(itemUri);
      
      const newHistory = [...history, rootUri!];
      setHistory(newHistory);
      setRootUri(itemUri);
      
      await AsyncStorage.setItem('opener_history', JSON.stringify(newHistory));
      await AsyncStorage.setItem('opener_current_folder', itemUri);
      await AsyncStorage.setItem('last_opened_screen', 'index');
      
      readDirectory(itemUri);
    } catch (e) {
      await AsyncStorage.setItem('current_file_uri', itemUri);
      await AsyncStorage.setItem('last_opened_screen', 'viewer');
      router.push({
        pathname: '/viewer',
        params: { name: filename }
      });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
      <Stack.Screen options={{ title: 'Opener' }} />
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
              const info = getFileInfo(filename, isDark);
              
              return (
                <TouchableOpacity 
                  style={[styles.fileItem, { borderBottomColor: isDark ? '#333' : '#e0e0e0' }]}
                  onPress={() => handleItemPress(item, filename, info.isFile)}
                >
                  <MaterialIcons name={info.icon as any} size={24} color={info.color} style={styles.icon} />
                  <Text style={[styles.fileText, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>{filename}</Text>
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
  fileText: { flex: 1, fontSize: 16 },
});
