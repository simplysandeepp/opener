import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, KeyboardAvoidingView, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

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
  // Keeps the Modal mounted through the close animation - Modal's own `visible` prop yanks it
  // away instantly, which would cut the slide-down animation off before it gets to play.
  const [isMounted, setIsMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setIsMounted(true);
      Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateY, { toValue: sheetHeight, duration: 200, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setIsMounted(false);
      });
    }
  }, [visible, sheetHeight, translateY]);

  return (
    <Modal visible={isMounted} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>
      <KeyboardAvoidingView
        behavior="padding"
        style={styles.avoidingContainer}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              backgroundColor: isDark ? '#17171a' : '#fff',
              borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'transparent',
              borderWidth: isDark ? 1 : 0,
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
