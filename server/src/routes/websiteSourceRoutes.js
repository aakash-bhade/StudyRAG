import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../validators/auth.js';
import { addWebsiteSourceAction, deleteWebsiteSourceAction, listWebsiteSourcesAction } from '../controllers/websiteSourceController.js';
import { addWebsiteSourceSchema } from '../validators/websiteSources.js';

const router = Router();
router.use(requireAuth);
router.get('/', listWebsiteSourcesAction);
router.post('/', rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false }), validate(addWebsiteSourceSchema), addWebsiteSourceAction);
router.delete('/:id', deleteWebsiteSourceAction);
export default router;
