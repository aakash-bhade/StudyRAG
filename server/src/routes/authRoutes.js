import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { changePasswordAction, exportDataAction, loginAction, logoutAction, meAction, refreshAction, registerAction, requestPasswordResetAction, requestVerificationAction, resetPasswordAction, updateProfileAction, verifyEmailAction } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { changePasswordSchema, emailActionRequestSchema, emailTokenSchema, loginSchema, passwordResetSchema, registerSchema, updateProfileSchema, validate } from '../validators/auth.js';

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
router.post('/verification/resend', authLimiter, validate(emailActionRequestSchema), requestVerificationAction);
router.post('/verification/confirm', authLimiter, validate(emailTokenSchema), verifyEmailAction);
router.post('/password-reset/request', authLimiter, validate(emailActionRequestSchema), requestPasswordResetAction);
router.post('/password-reset/confirm', authLimiter, validate(passwordResetSchema), resetPasswordAction);

export default router;
