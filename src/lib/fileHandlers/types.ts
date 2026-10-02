import type { ReactElement } from 'react';

export interface FileHandlerProps {
  content: string;
  isDark: boolean;
  /** Reports scroll direction while reading, so the viewer can hide/show its header (handlers with no scroll view can ignore this). */
  onScrollDirectionChange?: (direction: 'up' | 'down') => void;
}

export interface FileHandler {
  id: string;
  /** Decide whether this handler should render a given file. */
  canOpen: (filename: string, content: string) => boolean;
  render: (props: FileHandlerProps) => ReactElement | null;
  /** Optional custom edit UI. Falls back to the viewer's plain-text editor when absent. */
  edit?: (props: FileHandlerProps & { onChange: (text: string) => void }) => ReactElement | null;
}
