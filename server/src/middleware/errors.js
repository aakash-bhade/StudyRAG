import { randomUUID } from 'node:crypto';

export function requestId(req, res, next) {
  req.id = randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
}

export function notFound(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' }, requestId: req.id });
}

export function errorHandler(error, req, res, _next) {
  if (res.headersSent) return;
  const status = Number.isInteger(error.status) ? error.status : 500;
  if (status >= 500) console.error(`[${req.id}] Request failed (${error.code || 'INTERNAL_ERROR'})`, error.message);
  res.status(status).json({
    error: { code: error.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'), message: error.expose ? error.message : status >= 500 ? 'Something went wrong. Try again shortly.' : error.message, ...(error.details ? { details: error.details } : {}) },
    requestId: req.id,
  });
}

export function httpError(status, code, message) {
  return Object.assign(new Error(message), { status, code, expose: true });
}
