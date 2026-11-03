import { Router } from 'express';
import { deleteSavedItemAction, listSavedItemsAction, saveItemAction } from '../controllers/savedItemController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../validators/auth.js';
import { savedItemSchema } from '../validators/savedItems.js';

const router = Router();
router.use(requireAuth);
router.get('/', listSavedItemsAction);
router.post('/', validate(savedItemSchema), saveItemAction);
router.delete('/:id', deleteSavedItemAction);
export default router;
