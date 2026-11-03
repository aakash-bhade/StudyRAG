import mongoose from 'mongoose';
import { httpError } from '../middleware/errors.js';
import { Folder } from '../models/Folder.js';
import { Note } from '../models/Note.js';

function validId(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'INVALID_ID', 'The folder ID is invalid.');
  return id;
}
function serialize(folder) { return { id: String(folder._id), name: folder.name, createdAt: folder.createdAt, updatedAt: folder.updatedAt }; }
export async function listFolders(ownerId) {
  const folders = await Folder.find({ ownerId }).sort({ name: 1 }).limit(100).lean();
  return folders.map(serialize);
}
export async function createFolder(ownerId, data) {
  try { return serialize(await Folder.create({ ownerId, ...data })); }
  catch (error) { if (error.code === 11000) throw httpError(409, 'FOLDER_EXISTS', 'A folder with that name already exists.'); throw error; }
}
export async function updateFolder(ownerId, id, data) {
  validId(id);
  try {
    const folder = await Folder.findOneAndUpdate({ _id: id, ownerId }, data, { new: true, runValidators: true });
    if (!folder) throw httpError(404, 'FOLDER_NOT_FOUND', 'Folder not found.');
    return serialize(folder);
  } catch (error) { if (error.code === 11000) throw httpError(409, 'FOLDER_EXISTS', 'A folder with that name already exists.'); throw error; }
}
export async function deleteFolder(ownerId, id) {
  validId(id);
  const folder = await Folder.findOne({ _id: id, ownerId });
  if (!folder) throw httpError(404, 'FOLDER_NOT_FOUND', 'Folder not found.');
  await Note.updateMany({ ownerId, folderId: folder._id }, { $set: { folderId: null } });
  await Folder.deleteOne({ _id: folder._id, ownerId });
  return { success: true };
}
