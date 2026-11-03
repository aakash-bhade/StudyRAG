import { askInConversation, deleteConversation, getConversation, listConversations, renameConversation } from '../services/conversationService.js';

export async function askQuestionAction(req, res, next) {
  try {
    const result = await askInConversation(req.user._id, req.body);
    res.status(201).json(result);
  } catch (error) { next(error); }
}

export async function listConversationsAction(req, res, next) {
  try { res.json({ items: await listConversations(req.user._id) }); }
  catch (error) { next(error); }
}

export async function getConversationAction(req, res, next) {
  try { res.json({ item: await getConversation(req.user._id, req.params.id) }); }
  catch (error) { next(error); }
}

export async function renameConversationAction(req, res, next) {
  try { res.json({ item: await renameConversation(req.user._id, req.params.id, req.body.title) }); }
  catch (error) { next(error); }
}

export async function deleteConversationAction(req, res, next) {
  try { res.json(await deleteConversation(req.user._id, req.params.id)); }
  catch (error) { next(error); }
}
