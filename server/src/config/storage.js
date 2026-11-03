import { mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './env.js';

const defaultDirectory = fileURLToPath(new URL('../../storage/documents/', import.meta.url));
export const documentStorageDirectory = path.resolve(env.DOCUMENT_STORAGE_DIR || defaultDirectory);

export async function ensureDocumentStorage() {
  await mkdir(documentStorageDirectory, { recursive: true, mode: 0o700 });
}

export function documentFilePath(storageKey) {
  if (!/^[0-9a-f-]{36}\.(pdf|docx|txt)$/.test(storageKey)) throw new Error('Invalid internal document storage key.');
  return path.join(documentStorageDirectory, storageKey);
}

export async function removeStoredDocument(storageKey) {
  await unlink(documentFilePath(storageKey)).catch(error => { if (error.code !== 'ENOENT') throw error; });
}
