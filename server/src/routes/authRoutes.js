import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { changePasswordAction, exportDataAction, loginAction, logoutAction, meAction, refreshAction, registerAction, updateProfileAction } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema, validate } from '../validators/auth.js';

const router = Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false, message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait and try again.' } } });

router.post('/register', authLimiter, validate(registerSchema), registerAction);
router.post('/login', authLimiter, validate(loginSchema), loginAction);
router.post('/refresh', refreshAction);
router.post('/logout', logoutAction);
router.get('/me', requireAuth, meAction);
router.patch('/password', requireAuth, authLimiter, validate(changePasswordSchema), changePasswordAction);
router.patch('/profile', requireAuth, validate(updateProfileSchema), updateProfileAction);
router.get('/export', requireAuth, exportDataAction);

export default router;
