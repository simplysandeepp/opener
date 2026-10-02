import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import type { FileHandler } from './types';

function withViewport(html: string): string {
  if (html.toLowerCase().includes('meta name="viewport"')) return html;
  const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
  if (html.toLowerCase().includes('<head>')) {
    return html.replace(/<head>/i, `<head>${viewportTag}`);
  }
  return `<head>${viewportTag}</head>${html}`;
}

export const htmlHandler: FileHandler = {
  id: 'html',
  canOpen: (filename, content) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'html' || ext === 'htm') return true;
    const trimmed = content.trim();
    return trimmed.startsWith('<html') || trimmed.startsWith('<!DOCTYPE html>');
  },
  render: ({ content }) => (
    <WebView
      originWhitelist={['*']}
      source={{ html: withViewport(content) }}
      style={styles.webview}
      scalesPageToFit={false}
      javaScriptEnabled={true}
      domStorageEnabled={true}
    />
  ),
};

const styles = StyleSheet.create({
  webview: { flex: 1, backgroundColor: 'transparent' },
});
