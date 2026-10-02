import type { FileHandler } from './types';
import { htmlHandler } from './htmlHandler';
import { markdownHandler } from './markdownHandler';
import { jsonHandler } from './jsonHandler';
import { csvHandler } from './csvHandler';
import { codeHandler } from './codeHandler';
import { textHandler } from './textHandler';

/** Checked in order; textHandler is a catch-all and must stay last. */
export const fileHandlers: FileHandler[] = [
  htmlHandler,
  markdownHandler,
  jsonHandler,
  csvHandler,
  codeHandler,
  textHandler,
];

export function getFileHandler(filename: string, content: string): FileHandler {
  return fileHandlers.find((handler) => handler.canOpen(filename, content)) ?? textHandler;
}

export type { FileHandler, FileHandlerProps } from './types';
