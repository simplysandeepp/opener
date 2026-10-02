import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, Stack, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTabs } from '../contexts/TabsContext';
import { useTheme } from '../contexts/ThemeContext';
import { FileTabView, type TabHeaderState } from '../components/FileTabView';
import { TabBar } from '../components/TabBar';

export default function ViewerScreen() {
  const { tabs, activeUri, dirty } = useTabs();
  const { isDark } = useTheme();
  const navigation = useNavigation();
  const [headerState, setHeaderState] = useState<TabHeaderState | null>(null);

  useEffect(() => {
    AsyncStorage.setItem('last_opened_screen', 'viewer');
    return () => {
      AsyncStorage.setItem('last_opened_screen', 'index');
    };
  }, []);

  // All tabs were closed from within the viewer (tab bar) - nothing left to show.
  useEffect(() => {
    if (tabs.length === 0) router.back();
  }, [tabs.length]);

  const anyDirty = Object.values(dirty).some(Boolean);
  useEffect(() => {
    if (!anyDirty) return;
    return navigation.addListener('beforeRemove', (e) => {
      e.preventDefault();
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes in one or more open files. If you leave now they will be lost.',
        [
          { text: 'Keep editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]
      );
    });
  }, [anyDirty, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0c' : '#ffffff' }]}>
      <Stack.Screen
        options={{
          title: headerState?.title ?? 'File Viewer',
          headerRight: headerState ? () => (
            <TouchableOpacity onPress={headerState.onEditOrSave} disabled={headerState.isSaving} style={{ marginRight: 15 }}>
              <Text style={{ color: '#007AFF', fontSize: 16, fontWeight: 'bold' }}>
                {headerState.isSaving ? 'Saving...' : (headerState.isEditing ? 'Save' : 'Edit')}
              </Text>
            </TouchableOpacity>
          ) : undefined,
          headerLeft: headerState?.isEditing ? () => (
            <TouchableOpacity onPress={headerState.onCancel} style={{ marginLeft: 15 }}>
              <Text style={{ color: '#ff3b30', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          ) : undefined,
        }}
      />
      <TabBar isDark={isDark} />
      <View style={styles.content}>
        {tabs.map((tab) => (
          <FileTabView
            key={tab.uri}
            uri={tab.uri}
            name={tab.name}
            isActive={tab.uri === activeUri}
            onHeaderChange={setHeaderState}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
});
