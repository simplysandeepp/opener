import { isIncomingFileUri } from './incomingFile';

describe('isIncomingFileUri', () => {
  it('accepts content:// uris', () => {
    expect(isIncomingFileUri('content://com.android.externalstorage.documents/document/1234')).toBe(true);
  });

  it('accepts file:// uris', () => {
    expect(isIncomingFileUri('file:///storage/emulated/0/notes.txt')).toBe(true);
  });

  it('rejects the app\'s own scheme', () => {
    expect(isIncomingFileUri('opener://viewer')).toBe(false);
  });

  it('rejects http(s) urls', () => {
    expect(isIncomingFileUri('https://example.com')).toBe(false);
  });
});
