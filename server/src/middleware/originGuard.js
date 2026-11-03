import { env } from '../config/env.js';
import { httpError } from './errors.js';

const writeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function originGuard(req, _res, next) {
  if (!writeMethods.has(req.method)) return next();
  const origin = req.get('origin');
  if (origin && origin !== env.FRONTEND_ORIGIN) {
    return next(httpError(403, 'ORIGIN_NOT_ALLOWED', 'This request origin is not allowed.'));
  }
  if (req.is('application/json') !== 'application/json' && req.method !== 'DELETE') {
    return next(httpError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send mutations using JSON.'));
  }
  next();
}
