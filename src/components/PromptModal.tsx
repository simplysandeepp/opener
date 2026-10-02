import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface PromptModalProps {
  visible: boolean;
  title: string;
  initialValue?: string;
  placeholder?: string;
  confirmLabel?: string;
  isDark: boolean;
  onCancel: () => void;
  onSubmit: (value: string) => void;
}

export function PromptModal({
  visible,
  title,
  initialValue = '',
  placeholder,
  confirmLabel = 'Save',
  isDark,
  onCancel,
  onSubmit,
}: PromptModalProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: isDark ? '#242424' : '#fff' }]}>
          <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>{title}</Text>
          <TextInput
            autoFocus
            value={value}
            onChangeText={setValue}
            placeholder={placeholder}
            placeholderTextColor={isDark ? '#777' : '#999'}
            autoCapitalize="none"
            autoCorrect={false}
            style={[
              styles.input,
              { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#444' : '#ccc' },
            ]}
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onCancel} style={styles.actionBtn}>
              <Text style={{ color: isDark ? '#ccc' : '#444', fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onSubmit(value.trim())}
              style={styles.actionBtn}
              disabled={value.trim().length === 0}
            >
              <Text style={{ color: value.trim().length === 0 ? '#999' : '#007AFF', fontSize: 15, fontWeight: '600' }}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  card: { width: '100%', borderRadius: 12, padding: 20 },
  title: { fontSize: 17, fontWeight: '600', marginBottom: 14 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 18, gap: 20 },
  actionBtn: { paddingVertical: 6, paddingHorizontal: 4 },
});
