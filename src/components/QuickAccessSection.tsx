import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { FavoriteEntry } from '../hooks/useFavorites';
import type { RecentFile } from '../hooks/useRecents';

interface ChipProps {
  icon: string;
  iconColor: string;
  label: string;
  isDark: boolean;
  onPress: () => void;
}

function Chip({ icon, iconColor, label, isDark, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: isDark ? '#17171a' : '#eaeaea' }]}
      onPress={onPress}
    >
      <MaterialIcons name={icon as any} size={16} color={iconColor} style={styles.chipIcon} />
      <Text style={[styles.chipText, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface QuickAccessSectionProps {
  favorites: FavoriteEntry[];
  recents: RecentFile[];
  isDark: boolean;
  onOpenFavorite: (entry: FavoriteEntry) => void;
  onOpenRecent: (entry: RecentFile) => void;
}

export function QuickAccessSection({ favorites, recents, isDark, onOpenFavorite, onOpenRecent }: QuickAccessSectionProps) {
  if (favorites.length === 0 && recents.length === 0) return null;

  return (
    <View style={styles.container}>
      {favorites.length > 0 && (
        <View style={styles.row}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#aaa' : '#666' }]}>Favorites</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={favorites}
            keyExtractor={(item) => item.uri}
            contentContainerStyle={styles.chipRow}
            renderItem={({ item }) => (
              <Chip
                icon={item.isFolder ? 'folder' : 'star'}
                iconColor={item.isFolder ? '#fbc02d' : '#f9a825'}
                label={item.name}
                isDark={isDark}
                onPress={() => onOpenFavorite(item)}
              />
            )}
          />
        </View>
      )}
      {recents.length > 0 && (
        <View style={styles.row}>
          <Text style={[styles.sectionLabel, { color: isDark ? '#aaa' : '#666' }]}>Recent</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={recents}
            keyExtractor={(item) => item.uri}
            contentContainerStyle={styles.chipRow}
            renderItem={({ item }) => (
              <Chip
                icon="history"
                iconColor={isDark ? '#aaa' : '#666'}
                label={item.name}
                isDark={isDark}
                onPress={() => onOpenRecent(item)}
              />
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingTop: 10 },
  row: { marginBottom: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', marginLeft: 15, marginBottom: 6 },
  chipRow: { paddingHorizontal: 15, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, maxWidth: 180 },
  chipIcon: { marginRight: 6 },
  chipText: { fontSize: 13, flexShrink: 1 },
});
