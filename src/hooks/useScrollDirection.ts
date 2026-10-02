import { useCallback, useRef } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/**
 * Returns an onScroll handler that reports 'down'/'up' once scroll position has moved past
 * `threshold` px since the last report - used to hide the header while reading (scroll down)
 * and bring it back (scroll up), like a manga/reader app.
 */
export function useScrollDirection(onDirectionChange: (direction: 'up' | 'down') => void, threshold = 12) {
  const lastY = useRef(0);

  return useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;

    if (y <= 0) {
      onDirectionChange('up');
      lastY.current = 0;
      return;
    }

    const delta = y - lastY.current;
    if (Math.abs(delta) < threshold) return;

    onDirectionChange(delta > 0 ? 'down' : 'up');
    lastY.current = y;
  }, [onDirectionChange, threshold]);
}
