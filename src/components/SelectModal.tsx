import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface SelectOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface SelectModalProps {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selectedId?: string | null;
  isDark: boolean;
  onSelect: (id: string) => void;
  onCancel: () => void;
}

export function SelectModal({ visible, title, options, selectedId, isDark, onSelect, onCancel }: SelectModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: isDark ? '#242424' : '#fff' }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
            <TouchableOpacity onPress={onCancel} hitSlop={10}>
              <MaterialIcons name="close" size={22} color={isDark ? '#ccc' : '#444'} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => item.id}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.row} onPress={() => onSelect(item.id)}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowLabel, { color: isDark ? '#fff' : '#000' }]}>{item.label}</Text>
                  {item.sublabel && (
                    <Text style={[styles.rowSublabel, { color: isDark ? '#888' : '#999' }]}>{item.sublabel}</Text>
                  )}
                </View>
                {item.id === selectedId && <MaterialIcons name="check" size={20} color="#007AFF" />}
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  card: { width: '100%', maxHeight: '70%', borderRadius: 12, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { fontSize: 17, fontWeight: '600' },
  list: { flexGrow: 0 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowLabel: { fontSize: 15 },
  rowSublabel: { fontSize: 12, marginTop: 2 },
});
