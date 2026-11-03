import { askInConversation, deleteConversation, getConversation, listConversations, renameConversation } from '../services/conversationService.js';

export async function askQuestionAction(req, res, next) {
  const startStream = () => {
    if (res.headersSent) return;
    res.status(201).set({
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    res.flushHeaders();
  };
  try {
    const result = await askInConversation(req.user._id, req.body, {
      onToken: token => {
        startStream();
        res.write(`data: ${JSON.stringify({ token })}\n\n`);
      },
    });
    startStream();
    res.write(`data: ${JSON.stringify({ result })}\n\n`);
    res.end();
  } catch (error) {
    if (res.headersSent) {
      const status = Number.isInteger(error.status) ? error.status : 500;
      const payload = { code: error.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'), message: status >= 500 ? 'Something went wrong. Try again shortly.' : error.message };
      if (status >= 500) console.error(`[${req.id}] Streaming chat request failed`, error.message);
      res.write(`data: ${JSON.stringify({ error: payload })}\n\n`);
      res.end();
      return;
    }
    next(error);
  }
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
