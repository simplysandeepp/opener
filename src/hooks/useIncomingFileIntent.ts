import { useEffect, useRef } from 'react';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { useTabs } from '../contexts/TabsContext';
import { getDisplayName } from '../lib/fileKind';
import { isIncomingFileUri } from '../lib/incomingFile';

/**
 * Handles the app being opened via Android's "Open with Opener" (ACTION_VIEW
 * with a content:// uri) for .md/.html/.txt files, registered in app.json's
 * android.intentFilters. Opens the incoming file as a new tab.
 *
 * Note: ACTION_SEND (the Android Share sheet) isn't handled here - RN's core
 * Linking module only ever sees an intent's `data` URI, not its extras
 * (EXTRA_STREAM/EXTRA_TEXT), and there's no official Expo module for reading
 * those without a dedicated native module.
 */
export function useIncomingFileIntent() {
  const { openTab } = useTabs();
  const lastHandledRef = useRef<string | null>(null);
  const url = Linking.useLinkingURL();

  useEffect(() => {
    if (!url || url === lastHandledRef.current || !isIncomingFileUri(url)) return;
    lastHandledRef.current = url;
    Linking.clearInitialURL();
    openTab(url, getDisplayName(url));
    router.push('/viewer');
  }, [url, openTab]);
}
