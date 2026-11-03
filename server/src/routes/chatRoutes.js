import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { askQuestionAction } from '../controllers/chatController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../validators/auth.js';
import { questionSchema } from '../validators/chat.js';

const router = Router();
router.use(requireAuth);
router.post('/ask', rateLimit({ windowMs: 60_000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false }), validate(questionSchema), askQuestionAction);
export default router;
