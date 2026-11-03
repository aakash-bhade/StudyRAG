import { Router } from 'express';
import { deleteFlashcardDeckAction, generateFlashcardsAction, listFlashcardDecksAction } from '../controllers/flashcardController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../validators/auth.js';
import { generateFlashcardsSchema } from '../validators/flashcards.js';

const router = Router();
router.use(requireAuth);
router.get('/', listFlashcardDecksAction);
router.post('/generate', validate(generateFlashcardsSchema), generateFlashcardsAction);
router.delete('/:id', deleteFlashcardDeckAction);

export default router;
