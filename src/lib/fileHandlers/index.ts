import type { FileHandler } from './types';
import { htmlHandler } from './htmlHandler';
import { markdownHandler } from './markdownHandler';
import { textHandler } from './textHandler';

/** Checked in order; textHandler is a catch-all and must stay last. */
export const fileHandlers: FileHandler[] = [htmlHandler, markdownHandler, textHandler];

export function getFileHandler(filename: string, content: string): FileHandler {
  return fileHandlers.find((handler) => handler.canOpen(filename, content)) ?? textHandler;
}

export type { FileHandler, FileHandlerProps } from './types';
