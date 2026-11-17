import { createHash, randomUUID } from 'node:crypto';
import path from 'node:path';
import mongoose from 'mongoose';
import { getStoredDocument, putStoredDocument, removeStoredDocument } from '../config/storage.js';
import { Document } from '../models/Document.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { httpError } from '../middleware/errors.js';
import { documentMimeType, parseDocument, splitDocumentName } from './documentParser.js';

function safeId(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'INVALID_ID', 'The document ID is invalid.');
  return id;
}

function serialize(document) {
  return {
    id: String(document._id),
    displayName: document.displayName,
    originalName: document.originalName,
    mimeType: document.mimeType,
    byteSize: document.byteSize,
    status: document.status,
    pageCount: document.pageCount,
    chunkCount: document.chunkCount,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

export async function uploadOwnedDocument(userId, file) {
  if (!file) throw httpError(400, 'FILE_REQUIRED', 'Choose a PDF, DOCX, or TXT file to upload.');
  const extension = path.extname(file.originalname).toLowerCase();
  const parsed = await parseDocument(file.buffer, extension);
  const originalName = splitDocumentName(path.basename(file.originalname));
  const storageKey = `${randomUUID()}${extension}`;
  await putStoredDocument(storageKey, file.buffer);

  let document;
  try {
    document = await Document.create({
      ownerId: userId,
      displayName: originalName,
      originalName,
      storageKey,
      mimeType: documentMimeType(extension),
      byteSize: file.size,
      pageCount: parsed.pages,
      chunkCount: parsed.chunks.length,
      contentHash: createHash('sha256').update(file.buffer).digest('hex'),
    });
    await DocumentChunk.insertMany(parsed.chunks.map(chunk => ({ ...chunk, ownerId: userId, documentId: document._id })), { ordered: true });
    return serialize(document);
  } catch (error) {
    if (document) {
      await DocumentChunk.deleteMany({ ownerId: userId, documentId: document._id });
      await Document.deleteOne({ ownerId: userId, _id: document._id });
    }
    await removeStoredDocument(storageKey);
    throw error;
  }
}

export async function listOwnedDocuments(userId, { page, limit, q }) {
  const filter = { ownerId: userId };
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.displayName = { $regex: escaped, $options: 'i' };
  }
  const [documents, total] = await Promise.all([
    Document.find(filter).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit),
    Document.countDocuments(filter),
  ]);
  return { items: documents.map(serialize), page, limit, total, pages: Math.ceil(total / limit) };
}

export async function getOwnedDocument(userId, id, { includeStorageKey = false } = {}) {
  safeId(id);
  const query = Document.findOne({ _id: id, ownerId: userId });
  if (includeStorageKey) query.select('+storageKey');
  const document = await query;
  if (!document) throw httpError(404, 'DOCUMENT_NOT_FOUND', 'Document not found.');
  return document;
}

export async function renameOwnedDocument(userId, id, displayName) {
  const document = await getOwnedDocument(userId, id);
  document.displayName = splitDocumentName(displayName);
  await document.save();
  return serialize(document);
}

export async function deleteOwnedDocument(userId, id) {
  const document = await getOwnedDocument(userId, id, { includeStorageKey: true });
  await DocumentChunk.deleteMany({ ownerId: userId, documentId: document._id });
  await Document.deleteOne({ ownerId: userId, _id: document._id });
  try { await removeStoredDocument(document.storageKey); }
  catch (error) { console.error('Could not remove an owned document file:', error.message); }
  return { success: true };
}

export async function getOwnedDocumentFile(userId, id) {
  const document = await getOwnedDocument(userId, id, { includeStorageKey: true });
  try {
    const stored = await getStoredDocument(document.storageKey);
    if (!stored) throw httpError(404, 'DOCUMENT_FILE_NOT_FOUND', 'The stored document file is unavailable.');
    return { document, ...stored };
  } catch (error) {
    if (error.status) throw error;
    if (error.code === 'ENOENT') throw httpError(404, 'DOCUMENT_FILE_NOT_FOUND', 'The stored document file is unavailable.');
    throw httpError(502, 'DOCUMENT_STORAGE_UNAVAILABLE', 'The document could not be read from private storage.');
  }
}
