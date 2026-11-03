import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { httpError } from './errors.js';

export async function requireAuth(req, _res, next) {
  try {
    const token = req.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) throw httpError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
    const user = await User.findOne({ _id: payload.sub, status: 'active' }).select('_id email displayName role');
    if (!user) throw httpError(401, 'AUTH_REQUIRED', 'Please sign in to continue.');
    req.user = user;
    next();
  } catch (error) {
    next(error.status ? error : httpError(401, 'AUTH_REQUIRED', 'Your session has expired. Please sign in again.'));
  }
}
