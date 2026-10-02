import React from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTabs } from '../contexts/TabsContext';

interface TabBarProps {
  isDark: boolean;
}

export function TabBar({ isDark }: TabBarProps) {
  const { tabs, activeUri, dirty, setActiveTab, closeTab } = useTabs();

  if (tabs.length <= 1) return null;

  const handleClose = (uri: string, name: string) => {
    if (dirty[uri]) {
      Alert.alert('Discard changes?', `"${name}" has unsaved changes. Discard them and close this tab?`, [
        { text: 'Keep editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => closeTab(uri) },
      ]);
    } else {
      closeTab(uri);
    }
  };

  return (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={tabs}
      keyExtractor={(t) => t.uri}
      style={[styles.bar, { backgroundColor: isDark ? '#1a1a1a' : '#eaeaea', borderBottomColor: isDark ? '#333' : '#ddd' }]}
      contentContainerStyle={styles.barContent}
      renderItem={({ item }) => {
        const active = item.uri === activeUri;
        return (
          <TouchableOpacity
            style={[
              styles.tab,
              { backgroundColor: active ? (isDark ? '#2a2a2a' : '#fff') : 'transparent' },
            ]}
            onPress={() => setActiveTab(item.uri)}
          >
            {dirty[item.uri] && <View style={styles.dirtyDot} />}
            <Text numberOfLines={1} style={[styles.tabText, { color: isDark ? '#fff' : '#000' }]}>
              {item.name}
            </Text>
            <TouchableOpacity hitSlop={8} onPress={() => handleClose(item.uri, item.name)} style={styles.closeBtn}>
              <MaterialIcons name="close" size={15} color={isDark ? '#999' : '#666'} />
            </TouchableOpacity>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  bar: { flexGrow: 0, borderBottomWidth: 1 },
  barContent: { paddingHorizontal: 8, paddingVertical: 6, gap: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, maxWidth: 160 },
  tabText: { fontSize: 13, flexShrink: 1, marginRight: 4 },
  closeBtn: { marginLeft: 2 },
  dirtyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#f9a825', marginRight: 6 },
});
