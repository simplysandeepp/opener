/** A file opened via Android's "Open with" (ACTION_VIEW) arrives as a content:// or file:// url, not our app's own `opener://` scheme. */
export function isIncomingFileUri(url: string): boolean {
  return url.startsWith('content://') || url.startsWith('file://');
}
