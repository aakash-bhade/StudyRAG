import mongoose from 'mongoose';
import { httpError } from '../middleware/errors.js';
import { Note } from '../models/Note.js';
import { Folder } from '../models/Folder.js';

function validId(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'INVALID_ID', 'The note ID is invalid.');
  return id;
}

function serialize(note) {
  return { id: String(note._id), title: note.title, body: note.body, tags: note.tags, folderId: note.folderId ? String(note.folderId) : null, createdAt: note.createdAt, updatedAt: note.updatedAt };
}

async function validateFolder(ownerId, folderId) {
  if (folderId && !await Folder.exists({ _id: folderId, ownerId })) throw httpError(404, 'FOLDER_NOT_FOUND', 'The selected folder was not found.');
}

export async function listNotes(userId, query) {
  const filter = { ownerId: userId, deletedAt: null };
  if (query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ title: { $regex: escaped, $options: 'i' } }, { body: { $regex: escaped, $options: 'i' } }, { tags: { $regex: escaped, $options: 'i' } }];
  }
  const notes = await Note.find(filter).sort({ updatedAt: -1, _id: -1 }).limit(100).lean();
  return notes.map(serialize);
}

export async function createNote(userId, data) {
  await validateFolder(userId, data.folderId);
  const note = await Note.create({ ownerId: userId, ...data });
  return serialize(note);
}

export async function updateNote(userId, id, data) {
  validId(id);
  await validateFolder(userId, data.folderId);
  const note = await Note.findOneAndUpdate({ _id: id, ownerId: userId, deletedAt: null }, data, { returnDocument: 'after', runValidators: true });
  if (!note) throw httpError(404, 'NOTE_NOT_FOUND', 'Note not found.');
  return serialize(note);
}

export async function deleteNote(userId, id) {
  validId(id);
  const note = await Note.findOneAndDelete({ _id: id, ownerId: userId, deletedAt: null });
  if (!note) throw httpError(404, 'NOTE_NOT_FOUND', 'Note not found.');
  return { success: true };
}
