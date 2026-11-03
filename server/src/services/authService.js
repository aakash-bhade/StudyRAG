import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import { httpError } from '../middleware/errors.js';

const ACCESS_TTL = '15m';
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7;
const cookieName = 'studyrag_refresh';
const hashToken = token => createHash('sha256').update(token).digest('hex');
const equalHashes = (left, right) => timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));

function refreshCookieOptions() {
  return { httpOnly: true, secure: env.cookieSecure, sameSite: env.cookieSameSite, path: '/api/v1/auth', maxAge: REFRESH_TTL_SECONDS * 1000 };
}

function issueAccessToken(user) {
  return jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, { subject: String(user._id), expiresIn: ACCESS_TTL, algorithm: 'HS256' });
}

async function createSession(user, res) {
  const sessionId = randomUUID();
  const refreshToken = jwt.sign({ sid: sessionId, jti: randomUUID() }, env.JWT_REFRESH_SECRET, { subject: String(user._id), expiresIn: REFRESH_TTL_SECONDS, algorithm: 'HS256' });
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);
  await Session.create({ _id: sessionId, userId: user._id, refreshTokenHash: hashToken(refreshToken), expiresAt });
  res.cookie(cookieName, refreshToken, refreshCookieOptions());
}

function publicUser(user) {
  return { id: String(user._id), displayName: user.displayName, email: user.email, role: user.role };
}

export async function register(input, res) {
  const existing = await User.exists({ email: input.email });
  if (existing) throw httpError(409, 'ACCOUNT_EXISTS', 'An account with that email already exists.');
  const passwordHash = await bcrypt.hash(input.password, 12);
  let user;
  try {
    user = await User.create({ email: input.email, passwordHash, displayName: input.displayName, role: input.role });
  } catch (error) {
    if (error.code === 11000) throw httpError(409, 'ACCOUNT_EXISTS', 'An account with that email already exists.');
    throw error;
  }
  await createSession(user, res);
  return { accessToken: issueAccessToken(user), user: publicUser(user) };
}

export async function login(input, res) {
  const user = await User.findOne({ email: input.email, status: 'active' }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw httpError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.');
  }
  await createSession(user, res);
  return { accessToken: issueAccessToken(user), user: publicUser(user) };
}

export async function changePassword(userId, input) {
  const user = await User.findOne({ _id: userId, status: 'active' }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
    throw httpError(400, 'CURRENT_PASSWORD_INCORRECT', 'Your current password is incorrect.');
  }
  if (await bcrypt.compare(input.newPassword, user.passwordHash)) {
    throw httpError(400, 'PASSWORD_UNCHANGED', 'Choose a new password that is different from your current one.');
  }
  user.passwordHash = await bcrypt.hash(input.newPassword, 12);
  await user.save();
  await Session.updateMany({ userId: user._id, revokedAt: null }, { $set: { revokedAt: new Date() } });
  return { success: true, sessionsRevoked: true };
}

export async function updateProfile(userId, input) {
  const user = await User.findOneAndUpdate(
    { _id: userId, status: 'active' },
    { $set: { displayName: input.displayName } },
    { new: true, runValidators: true, select: '_id displayName email role' },
  );
  if (!user) throw httpError(404, 'USER_NOT_FOUND', 'Your account could not be found.');
  return { user: publicUser(user) };
}

export async function refreshSession(refreshToken, res) {
  if (!refreshToken) throw httpError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');
  let payload;
  try { payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] }); }
  catch { throw httpError(401, 'AUTH_REQUIRED', 'Your session has expired. Please sign in again.'); }

  const user = await User.findOne({ _id: payload.sub, status: 'active' }).select('_id email displayName role');
  const session = await Session.findOne({ _id: payload.sid, userId: payload.sub, revokedAt: null, expiresAt: { $gt: new Date() } }).select('+refreshTokenHash');
  if (!user || !session || !equalHashes(session.refreshTokenHash, hashToken(refreshToken))) {
    throw httpError(401, 'AUTH_REQUIRED', 'Your session has expired. Please sign in again.');
  }
  const nextToken = jwt.sign({ sid: String(session._id), jti: randomUUID() }, env.JWT_REFRESH_SECRET, { subject: String(user._id), expiresIn: REFRESH_TTL_SECONDS, algorithm: 'HS256' });
  const rotated = await Session.findOneAndUpdate(
    { _id: session._id, userId: payload.sub, revokedAt: null, refreshTokenHash: hashToken(refreshToken), expiresAt: { $gt: new Date() } },
    { $set: { refreshTokenHash: hashToken(nextToken), expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000) } },
    { new: true },
  );
  if (!rotated) throw httpError(401, 'AUTH_REQUIRED', 'Your session has expired. Please sign in again.');
  res.cookie(cookieName, nextToken, refreshCookieOptions());
  return { accessToken: issueAccessToken(user), user: publicUser(user) };
}

export async function logout(refreshToken, res) {
  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'], ignoreExpiration: true });
      await Session.updateOne({ _id: payload.sid, userId: payload.sub }, { $set: { revokedAt: new Date() } });
    } catch { /* Invalid or expired cookies are still cleared locally. */ }
  }
  res.clearCookie(cookieName, { ...refreshCookieOptions(), maxAge: undefined });
  return { success: true };
}

export function getRefreshCookieName() { return cookieName; }
export function getPublicUser(user) { return publicUser(user); }
export function makeAccessToken(user) { return issueAccessToken(user); }
