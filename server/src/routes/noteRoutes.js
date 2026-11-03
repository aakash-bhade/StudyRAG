import { Router } from 'express';
import { createNoteAction, deleteNoteAction, listNotesAction, updateNoteAction } from '../controllers/noteController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../validators/auth.js';
import { noteListSchema, noteSchema } from '../validators/notes.js';

const router = Router();
router.use(requireAuth);
router.get('/', (req, res, next) => {
  const result = noteListSchema.safeParse(req.query);
  if (!result.success) return next(Object.assign(new Error('Please check your note search.'), { status: 400, code: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors }));
  req.validatedQuery = result.data;
  next();
}, listNotesAction);
router.post('/', validate(noteSchema), createNoteAction);
router.patch('/:id', validate(noteSchema), updateNoteAction);
router.delete('/:id', deleteNoteAction);
export default router;
