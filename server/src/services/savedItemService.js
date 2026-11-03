import mongoose from 'mongoose';
import { httpError } from '../middleware/errors.js';
import { Document } from '../models/Document.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { SavedItem } from '../models/SavedItem.js';
import { WebsiteSource } from '../models/WebsiteSource.js';
import { WebsiteChunk } from '../models/WebsiteChunk.js';

function validId(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'INVALID_ID', 'The saved item ID is invalid.');
  return id;
}
function serialize(item) {
  return { id: String(item._id), sourceType: item.sourceType, sourceId: String(item.sourceId), sourceName: item.sourceName, url: item.url, page: item.page, ordinal: item.ordinal, excerpt: item.excerpt, createdAt: item.createdAt };
}
export async function listSavedItems(ownerId) {
  return (await SavedItem.find({ ownerId }).sort({ createdAt: -1 }).limit(200).lean()).map(serialize);
}
export async function saveItem(ownerId, data) {
  const sourceId = data.sourceId;
  let snapshot;
  if (data.sourceType === 'document') {
    const [document, chunk] = await Promise.all([
      Document.findOne({ _id: sourceId, ownerId }).select('displayName').lean(),
      DocumentChunk.findOne({ ownerId, documentId: sourceId, ordinal: data.ordinal }).select('text page').lean(),
    ]);
    if (!document || !chunk) throw httpError(404, 'SOURCE_NOT_FOUND', 'This cited source is no longer available in your workspace.');
    if (!chunk.text.startsWith(data.excerpt)) throw httpError(400, 'CITATION_MISMATCH', 'The saved excerpt must match the cited passage.');
    snapshot = { sourceName: document.displayName, page: chunk.page, excerpt: data.excerpt };
  } else {
    const [source, chunk] = await Promise.all([
      WebsiteSource.findOne({ _id: sourceId, ownerId }).select('title url').lean(),
      WebsiteChunk.findOne({ ownerId, sourceId, ordinal: data.ordinal }).select('text').lean(),
    ]);
    if (!source || !chunk) throw httpError(404, 'SOURCE_NOT_FOUND', 'This cited source is no longer available in your workspace.');
    if (!chunk.text.startsWith(data.excerpt)) throw httpError(400, 'CITATION_MISMATCH', 'The saved excerpt must match the cited passage.');
    snapshot = { sourceName: source.title, url: source.url, page: null, excerpt: data.excerpt };
  }
  const item = await SavedItem.findOneAndUpdate(
    { ownerId, sourceType: data.sourceType, sourceId, ordinal: data.ordinal },
    { $setOnInsert: { ownerId, sourceType: data.sourceType, sourceId, ordinal: data.ordinal, ...snapshot } },
    { returnDocument: 'after', upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  return serialize(item);
}
export async function deleteSavedItem(ownerId, id) {
  validId(id);
  const item = await SavedItem.findOneAndDelete({ _id: id, ownerId });
  if (!item) throw httpError(404, 'SAVED_ITEM_NOT_FOUND', 'Saved item not found.');
  return { success: true };
}
