import { createHash, createHmac } from 'node:crypto';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { env } from './env.js';

const defaultDirectory = fileURLToPath(new URL('../../storage/documents/', import.meta.url));
export const documentStorageDirectory = path.resolve(env.DOCUMENT_STORAGE_DIR || defaultDirectory);
const algorithm = 'AWS4-HMAC-SHA256';
const sha256 = value => createHash('sha256').update(value).digest('hex');
const hmac = (key, value, encoding) => createHmac('sha256', key).update(value).digest(encoding);

export function storageProvider() { return env.STORAGE_PROVIDER; }
export async function ensureDocumentStorage() {
  if (storageProvider() === 'local') await mkdir(documentStorageDirectory, { recursive: true, mode: 0o700 });
}
export function documentFilePath(storageKey) {
  if (!/^[0-9a-f-]{36}\.(pdf|docx|txt)$/.test(storageKey)) throw new Error('Invalid internal document storage key.');
  return path.join(documentStorageDirectory, storageKey);
}

function objectUrl(storageKey) {
  const endpoint = new URL(env.S3_ENDPOINT);
  const prefix = endpoint.pathname.replace(/\/$/, '');
  endpoint.pathname = `${prefix}/${encodeURIComponent(env.S3_BUCKET)}/${storageKey}`;
  endpoint.search = '';
  endpoint.hash = '';
  return endpoint;
}

function signingKey(dateStamp) {
  const dateKey = hmac(`AWS4${env.S3_SECRET_ACCESS_KEY}`, dateStamp);
  const regionKey = hmac(dateKey, env.S3_REGION);
  const serviceKey = hmac(regionKey, 's3');
  return hmac(serviceKey, 'aws4_request');
}

async function s3Request(method, storageKey, body) {
  const url = objectUrl(storageKey);
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = sha256(body || Buffer.alloc(0));
  const canonicalHeaders = `host:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [method, url.pathname, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const scope = `${dateStamp}/${env.S3_REGION}/s3/aws4_request`;
  const stringToSign = [algorithm, amzDate, scope, sha256(canonicalRequest)].join('\n');
  const signature = hmac(signingKey(dateStamp), stringToSign, 'hex');
  const authorization = `${algorithm} Credential=${env.S3_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return fetch(url, {
    method,
    headers: {
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: authorization,
      ...(body ? { 'Content-Type': 'application/octet-stream', 'Content-Length': String(body.length) } : {}),
    },
    ...(body ? { body } : {}),
  });
}

export async function putStoredDocument(storageKey, buffer) {
  if (storageProvider() === 'local') {
    await ensureDocumentStorage();
    return writeFile(documentFilePath(storageKey), buffer, { flag: 'wx', mode: 0o600 });
  }
  const response = await s3Request('PUT', storageKey, buffer);
  if (!response.ok) throw new Error(`Private object storage upload failed (${response.status}).`);
}

export async function getStoredDocument(storageKey) {
  if (storageProvider() === 'local') {
    const filePath = documentFilePath(storageKey);
    const details = await stat(filePath);
    return { stream: createReadStream(filePath), size: details.size };
  }
  const response = await s3Request('GET', storageKey);
  if (response.status === 404) return null;
  if (!response.ok || !response.body) throw new Error(`Private object storage download failed (${response.status}).`);
  return { stream: Readable.fromWeb(response.body), size: Number(response.headers.get('content-length')) || undefined };
}

export async function removeStoredDocument(storageKey) {
  if (storageProvider() === 'local') {
    await unlink(documentFilePath(storageKey)).catch(error => { if (error.code !== 'ENOENT') throw error; });
    return;
  }
  const response = await s3Request('DELETE', storageKey);
  if (!response.ok && response.status !== 404) throw new Error(`Private object storage deletion failed (${response.status}).`);
}

export async function storedDocumentExists(storageKey) {
  if (storageProvider() === 'local') {
    try { await stat(documentFilePath(storageKey)); return true; }
    catch (error) { if (error.code === 'ENOENT') return false; throw error; }
  }
  const response = await s3Request('HEAD', storageKey);
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`Private object storage check failed (${response.status}).`);
  return true;
}

export async function readLocalStoredDocument(storageKey) {
  return readFile(documentFilePath(storageKey));
}
