const BACKUP_FILENAME = 'opener-backup.json';
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

/** Looks for the app's backup file in the hidden per-app "appDataFolder" (not visible in the user's regular Drive). */
export async function findBackupFile(accessToken: string): Promise<string | null> {
  const query = encodeURIComponent(`name='${BACKUP_FILENAME}'`);
  const url = `${FILES_URL}?spaces=appDataFolder&q=${query}&fields=files(id)`;
  const response = await driveFetch(url, accessToken);
  const json = await response.json();
  return json.files?.[0]?.id ?? null;
}

export async function uploadBackup(accessToken: string, data: unknown, existingFileId: string | null): Promise<void> {
  const boundary = `opener-backup-boundary-${Date.now()}`;
  const metadata = existingFileId ? {} : { name: BACKUP_FILENAME, parents: ['appDataFolder'] };
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
