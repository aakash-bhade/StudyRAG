import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

const bucketName = 'study_files';
const bucket = () => new GridFSBucket(mongoose.connection.db, { bucketName });
const validKey = key => /^[0-9a-f-]{36}\.(pdf|docx|txt)$/.test(key);
const once = (stream, event) => new Promise((resolve, reject) => {
  stream.once(event, resolve);
  stream.once('error', reject);
});

export async function putStoredDocument(storageKey, buffer) {
  if (!validKey(storageKey)) throw new Error('Invalid internal document storage key.');
  const upload = bucket().openUploadStream(storageKey, { metadata: { private: true } });
  upload.end(buffer);
  await once(upload, 'finish');
}

export async function getStoredDocument(storageKey) {
  if (!validKey(storageKey)) throw new Error('Invalid internal document storage key.');
  const files = await bucket().find({ filename: storageKey }).limit(1).toArray();
  if (!files.length) return null;
  return { stream: bucket().openDownloadStream(files[0]._id), size: files[0].length };
}

export async function removeStoredDocument(storageKey) {
  if (!validKey(storageKey)) throw new Error('Invalid internal document storage key.');
  const files = await bucket().find({ filename: storageKey }).toArray();
  await Promise.all(files.map(file => bucket().delete(file._id)));
}
