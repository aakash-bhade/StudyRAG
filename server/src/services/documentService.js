import { createHash, randomUUID } from 'node:crypto';
import { stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import mongoose from 'mongoose';
import { documentFilePath, ensureDocumentStorage, removeStoredDocument } from '../config/storage.js';
import { Document } from '../models/Document.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { env } from '../config/env.js';
import { httpError } from '../middleware/errors.js';
import { documentMimeType, parseDocument, splitDocumentName } from './documentParser.js';
import { embedTexts } from './embeddingService.js';

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
  await ensureDocumentStorage();
  await writeFile(documentFilePath(storageKey), file.buffer, { flag: 'wx', mode: 0o600 });

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

export async function indexOwnedDocumentEmbeddings(userId, id) {
  const document = await getOwnedDocument(userId, id);
  const chunks = await DocumentChunk.find({ ownerId: userId, documentId: document._id }).select('_id text').limit(2000).lean();
  if (!chunks.length) throw httpError(422, 'DOCUMENT_HAS_NO_CHUNKS', 'This document has no searchable passages to index.');
  const embeddings = await embedTexts(chunks.map(chunk => chunk.text));
  const operations = chunks.map((chunk, index) => ({ updateOne: { filter: { _id: chunk._id, ownerId: userId }, update: { $set: { embedding: embeddings[index], embeddingModel: env.OLLAMA_EMBEDDING_MODEL } } } }));
  const result = await DocumentChunk.bulkWrite(operations, { ordered: true });
  if (result.matchedCount !== chunks.length) throw httpError(409, 'DOCUMENT_CHANGED', 'The document changed while its semantic index was being built. Please try again.');
  return { id: String(document._id), indexedChunkCount: chunks.length, embeddingModel: env.OLLAMA_EMBEDDING_MODEL };
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
  const filePath = documentFilePath(document.storageKey);
  try { await stat(filePath); }
  catch { throw httpError(404, 'DOCUMENT_FILE_NOT_FOUND', 'The stored document file is unavailable.'); }
  return { document, filePath };
}
