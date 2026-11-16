import { env } from '../config/env.js';

const developmentHosts = new Set(['localhost', '127.0.0.1', '[::1]']);

export function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (origin === env.FRONTEND_ORIGIN) return true;

  // Vite can move to another port when its default port is already occupied.
  // In development, accept only HTTP origins on the local machine.
  if (env.NODE_ENV !== 'development') return false;

  try {
    const url = new URL(origin);
    return url.protocol === 'http:' && developmentHosts.has(url.hostname);
  } catch {
    return false;
  }
}
