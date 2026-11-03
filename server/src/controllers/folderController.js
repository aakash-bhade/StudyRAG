import { createFolder, deleteFolder, listFolders, updateFolder } from '../services/folderService.js';

export async function listFoldersAction(req, res, next) {
  try { res.json({ items: await listFolders(req.user._id) }); } catch (error) { next(error); }
}
export async function createFolderAction(req, res, next) {
  try { res.status(201).json({ item: await createFolder(req.user._id, req.body) }); } catch (error) { next(error); }
}
export async function updateFolderAction(req, res, next) {
  try { res.json({ item: await updateFolder(req.user._id, req.params.id, req.body) }); } catch (error) { next(error); }
}
export async function deleteFolderAction(req, res, next) {
  try { res.json(await deleteFolder(req.user._id, req.params.id)); } catch (error) { next(error); }
}
