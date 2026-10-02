import React from 'react';
import Markdown from 'react-native-markdown-display';

interface ChatMarkdownProps {
  content: string;
  color: string;
  isDark: boolean;
}

/** Renders an assistant reply's markdown (bold/lists/code/links) instead of showing raw *asterisks*. */
export const ChatMarkdown = React.memo(function ChatMarkdown({ content, color, isDark }: ChatMarkdownProps) {
  return (
    <Markdown
      style={{
        body: { color, fontSize: 14, lineHeight: 20 },
        paragraph: { marginTop: 0, marginBottom: 6 },
        heading1: { color, fontSize: 17, marginBottom: 6 },
        heading2: { color, fontSize: 16, marginBottom: 6 },
        heading3: { color, fontSize: 15, marginBottom: 4 },
        bullet_list: { marginBottom: 6 },
        ordered_list: { marginBottom: 6 },
        list_item: { marginBottom: 2 },
        strong: { fontWeight: '700' },
        link: { color: '#007AFF' },
        code_inline: {
          backgroundColor: isDark ? '#17171a' : '#eaeaea',
          color: isDark ? '#ff9800' : '#d32f2f',
          fontFamily: 'monospace',
          borderRadius: 4,
          paddingHorizontal: 4,
        },
        fence: {
          backgroundColor: isDark ? '#17171a' : '#f0f0f0',
          color: isDark ? '#d4d4d4' : '#333333',
          fontFamily: 'monospace',
          fontSize: 13,
          padding: 8,
          borderRadius: 6,
          marginVertical: 6,
        },
        code_block: {
          backgroundColor: isDark ? '#17171a' : '#f0f0f0',
          color: isDark ? '#d4d4d4' : '#333333',
          fontFamily: 'monospace',
          fontSize: 13,
          padding: 8,
          borderRadius: 6,
          marginVertical: 6,
        },
      }}
    >
      {content}
    </Markdown>
  );
});
