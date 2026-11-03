import { addOwnedWebsiteSource, deleteOwnedWebsiteSource, listOwnedWebsiteSources } from '../services/websiteSourceService.js';

export async function listWebsiteSourcesAction(req, res, next) {
  try { res.json(await listOwnedWebsiteSources(req.user._id)); } catch (error) { next(error); }
}
export async function addWebsiteSourceAction(req, res, next) {
  try { res.status(201).json({ item: await addOwnedWebsiteSource(req.user._id, req.body.url) }); } catch (error) { next(error); }
}
export async function deleteWebsiteSourceAction(req, res, next) {
  try { res.json(await deleteOwnedWebsiteSource(req.user._id, req.params.id)); } catch (error) { next(error); }
}
