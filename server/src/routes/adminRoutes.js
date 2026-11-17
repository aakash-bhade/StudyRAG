import { Router } from 'express';
import { adminOverviewAction } from '../controllers/adminController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/overview', adminOverviewAction);
export default router;
