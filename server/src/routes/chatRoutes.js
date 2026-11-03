import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { askQuestionAction, deleteConversationAction, getConversationAction, listConversationsAction } from '../controllers/chatController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../validators/auth.js';
import { questionSchema } from '../validators/chat.js';

const router = Router();
router.use(requireAuth);
router.get('/conversations', listConversationsAction);
router.get('/conversations/:id', getConversationAction);
router.delete('/conversations/:id', deleteConversationAction);
router.post('/ask', rateLimit({ windowMs: 60_000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false }), validate(questionSchema), askQuestionAction);
export default router;
