import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { httpError } from '../middleware/errors.js';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import { sendActionEmail } from './mailService.js';

const hashToken = token => createHash('sha256').update(token).digest('hex');
const tokenForLink = () => randomBytes(32).toString('base64url');
const escapeHtml = value => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const actionUrl = (path, token) => `${env.FRONTEND_ORIGIN.replace(/\/$/, '')}/${path}#token=${encodeURIComponent(token)}`;

async function issueVerification(user) {
  const token = tokenForLink();
  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  user.emailVerificationSentAt = new Date();
  await user.save();
  const url = actionUrl('verify-email', token);
  const name = escapeHtml(user.displayName);
  await sendActionEmail({
    to: user.email,
    subject: 'Verify your StudyRAG email',
    text: `Hi ${user.displayName}, verify your StudyRAG email within 24 hours: ${url}`,
    html: `<p>Hi ${name},</p><p>Verify your email to secure your StudyRAG account.</p><p><a href="${url}">Verify email</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this message.</p>`,
  });
}

export async function requestEmailVerification(email) {
  if (!env.smtpConfigured) throw httpError(503, 'EMAIL_UNAVAILABLE', 'Email delivery is not configured for this StudyRAG deployment.');
  const user = await User.findOne({ email, status: 'active', emailVerifiedAt: null }).select('+emailVerificationTokenHash +emailVerificationExpiresAt +emailVerificationSentAt');
  if (user) {
    if (user.emailVerificationSentAt && Date.now() - user.emailVerificationSentAt.getTime() < 60_000) return { success: true };
    try { await issueVerification(user); } catch (error) { console.error('[email] Verification message delivery failed:', error.name); }
  }
  return { success: true };
}

export async function sendVerificationForUser(user) {
  await issueVerification(user);
}

export async function verifyEmailToken(token) {
  const user = await User.findOneAndUpdate({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpiresAt: { $gt: new Date() },
    emailVerifiedAt: null,
    status: 'active',
  }, {
    $set: { emailVerifiedAt: new Date() },
    $unset: { emailVerificationTokenHash: 1, emailVerificationExpiresAt: 1, emailVerificationSentAt: 1 },
  }, { new: true }).select('_id emailVerifiedAt');
  if (!user) throw httpError(400, 'EMAIL_TOKEN_INVALID', 'This verification link is invalid or expired. Request a new one and try again.');
  return { success: true };
}

export async function requestPasswordReset(email) {
  if (!env.smtpConfigured) throw httpError(503, 'EMAIL_UNAVAILABLE', 'Email delivery is not configured for this StudyRAG deployment.');
  const user = await User.findOne({ email, status: 'active', emailVerifiedAt: { $ne: null } }).select('+passwordResetTokenHash +passwordResetExpiresAt +passwordResetSentAt');
  if (!user) return { success: true };
  if (user.passwordResetSentAt && Date.now() - user.passwordResetSentAt.getTime() < 60_000) return { success: true };
  const token = tokenForLink();
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  user.passwordResetSentAt = new Date();
  await user.save();
  const url = actionUrl('reset-password', token);
  const name = escapeHtml(user.displayName);
  try {
    await sendActionEmail({
      to: user.email,
      subject: 'Reset your StudyRAG password',
      text: `Hi ${user.displayName}, reset your StudyRAG password within one hour: ${url}`,
      html: `<p>Hi ${name},</p><p>A password reset was requested for your StudyRAG account.</p><p><a href="${url}">Choose a new password</a></p><p>This link expires in one hour. If you did not request this, ignore this message. Your current password will remain unchanged.</p>`,
    });
  } catch (error) { console.error('[email] Password reset message delivery failed:', error.name); }
  return { success: true };
}

export async function resetPasswordWithToken(token, newPassword) {
  const user = await User.findOne({ passwordResetTokenHash: hashToken(token), passwordResetExpiresAt: { $gt: new Date() }, status: 'active' }).select('+passwordResetTokenHash +passwordResetExpiresAt +passwordHash');
  if (!user) throw httpError(400, 'RESET_TOKEN_INVALID', 'This password reset link is invalid or expired. Request a new one and try again.');
  if (await bcrypt.compare(newPassword, user.passwordHash)) {
    throw httpError(400, 'PASSWORD_UNCHANGED', 'Choose a new password that is different from your current one.');
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  const updated = await User.findOneAndUpdate({
    _id: user._id,
    passwordHash: user.passwordHash,
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  }, {
    $set: { passwordHash },
    $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1, passwordResetSentAt: 1 },
  }, { new: true }).select('_id');
  if (!updated) throw httpError(400, 'RESET_TOKEN_INVALID', 'This password reset link is invalid or expired. Request a new one and try again.');
  await Session.updateMany({ userId: updated._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  return { success: true };
}

export function emailVerificationEnabled() { return env.smtpConfigured; }
