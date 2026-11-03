import { answerFromDocuments } from '../services/chatService.js';

export async function askQuestionAction(req, res, next) {
  try {
    const result = await answerFromDocuments(req.user._id, req.body);
    res.json({ item: result });
  } catch (error) { next(error); }
}
