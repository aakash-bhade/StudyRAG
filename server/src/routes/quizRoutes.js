import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../validators/auth.js';
import { generateQuizAction, getQuizAction, listQuizzesAction, submitQuizAttemptAction } from '../controllers/quizController.js';
import { generateQuizSchema, quizAttemptSchema } from '../validators/quizzes.js';

const router = Router();
router.use(requireAuth);
router.get('/', listQuizzesAction);
router.post('/generate', rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false }), validate(generateQuizSchema), generateQuizAction);
router.get('/:id', getQuizAction);
router.post('/:id/attempts', rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: 'draft-8', legacyHeaders: false }), validate(quizAttemptSchema), submitQuizAttemptAction);
export default router;
