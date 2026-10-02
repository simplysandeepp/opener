import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, KeyboardAvoidingView, Modal, Platform, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
  heightPercent?: number;
  children: React.ReactNode;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

/**
 * Minimal slide-up sheet built on Modal + Animated, so this feature doesn't
 * need to pull in a bottom-sheet library (and its reanimated/gesture-handler
 * version requirements) for one screen.
 */
export function BottomSheet({ visible, onClose, isDark, heightPercent = 0.75, children }: BottomSheetProps) {
  const sheetHeight = SCREEN_HEIGHT * heightPercent;
  const [translateY] = useState(() => new Animated.Value(sheetHeight));

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : sheetHeight,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, sheetHeight, translateY]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.avoidingContainer}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              backgroundColor: isDark ? '#1e1e1e' : '#fff',
              transform: [{ translateY }],
            },
          ]}
        >
          <TouchableOpacity style={styles.grabberRow} onPress={onClose}>
            <View style={[styles.grabber, { backgroundColor: isDark ? '#555' : '#ccc' }]} />
          </TouchableOpacity>
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.4)' },
  avoidingContainer: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  grabberRow: { alignItems: 'center', paddingVertical: 8 },
  grabber: { width: 40, height: 4, borderRadius: 2 },
});
