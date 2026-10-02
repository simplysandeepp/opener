const BACKUP_FILENAME = 'opener-backup.json';
const FOLDER_NAME = 'Opener';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';
const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';

async function driveFetch(url: string, accessToken: string, init?: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Google Drive request failed (${response.status}): ${body || response.statusText}`);
  }
  return response;
}

/**
 * Finds the visible "Opener" folder in the user's My Drive, creating it if it doesn't exist yet.
 * Uses the drive.file scope: the app can only see files/folders it creates itself (or the user
 * explicitly opens with it), never the rest of the user's Drive.
 */
export async function findOrCreateOpenerFolder(accessToken: string): Promise<string> {
  const query = encodeURIComponent(`name='${FOLDER_NAME}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false`);
  const listResponse = await driveFetch(`${FILES_URL}?q=${query}&fields=files(id)`, accessToken);
  const listJson = await listResponse.json();
  const existingId = listJson.files?.[0]?.id;
  if (existingId) return existingId;

  const createResponse = await driveFetch(FILES_URL, accessToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: FOLDER_MIME_TYPE }),
  });
  const createJson = await createResponse.json();
  return createJson.id;
}

/** Looks for the backup file inside the "Opener" folder. */
export async function findBackupFile(accessToken: string, folderId: string): Promise<string | null> {
  const query = encodeURIComponent(`name='${BACKUP_FILENAME}' and '${folderId}' in parents and trashed=false`);
  const response = await driveFetch(`${FILES_URL}?q=${query}&fields=files(id)`, accessToken);
  const json = await response.json();
  return json.files?.[0]?.id ?? null;
}

export async function uploadBackup(
  accessToken: string,
  data: unknown,
  folderId: string,
  existingFileId: string | null
): Promise<void> {
  const boundary = `opener-backup-boundary-${Date.now()}`;
  const metadata = existingFileId ? {} : { name: BACKUP_FILENAME, parents: [folderId] };
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(data)}\r\n` +
    `--${boundary}--`;

  const url = existingFileId
    ? `${UPLOAD_URL}/${existingFileId}?uploadType=multipart`
    : `${UPLOAD_URL}?uploadType=multipart`;

  await driveFetch(url, accessToken, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
}

export async function downloadBackup<T>(accessToken: string, fileId: string): Promise<T> {
  const response = await driveFetch(`${FILES_URL}/${fileId}?alt=media`, accessToken);
  return response.json();
}
