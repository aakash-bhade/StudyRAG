import { Router } from 'express';
import { createFolderAction, deleteFolderAction, listFoldersAction, updateFolderAction } from '../controllers/folderController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../validators/auth.js';
import { folderSchema } from '../validators/folders.js';

const router = Router();
router.use(requireAuth);
router.get('/', listFoldersAction);
router.post('/', validate(folderSchema), createFolderAction);
router.patch('/:id', validate(folderSchema), updateFolderAction);
router.delete('/:id', deleteFolderAction);
export default router;
