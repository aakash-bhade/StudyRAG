import { deleteSavedItem, listSavedItems, saveItem } from '../services/savedItemService.js';

export async function listSavedItemsAction(req, res, next) {
  try { res.json({ items: await listSavedItems(req.user._id) }); } catch (error) { next(error); }
}
export async function saveItemAction(req, res, next) {
  try { res.status(201).json({ item: await saveItem(req.user._id, req.body) }); } catch (error) { next(error); }
}
export async function deleteSavedItemAction(req, res, next) {
  try { res.json(await deleteSavedItem(req.user._id, req.params.id)); } catch (error) { next(error); }
}
