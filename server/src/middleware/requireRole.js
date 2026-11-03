import { httpError } from './errors.js';

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(httpError(403, 'FORBIDDEN', 'You do not have access to this resource.'));
    }
    next();
  };
}
