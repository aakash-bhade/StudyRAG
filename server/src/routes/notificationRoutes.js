import { Router } from 'express';
import { listNotificationsAction, markNotificationReadAction } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();
router.use(requireAuth);
router.get('/', listNotificationsAction);
router.patch('/:id/read', markNotificationReadAction);
export default router;
