const AUTH_PATH = '/api/v1/auth';
let refreshPromise;

async function request(path, body) {
  const response = await fetch(`${AUTH_PATH}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error?.message || 'Could not connect. Please try again.');
    error.code = result.error?.code;
    throw error;
  }
  return result;
}

async function publicAction(path, body) {
  const response = await fetch(`${AUTH_PATH}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error?.message || 'Could not complete this request.');
    error.code = result.error?.code;
    throw error;
  }
  return result;
}

export const authApi = {
  login: data => request('/login', data),
  register: data => request('/register', data),
  requestVerification: email => publicAction('/verification/resend', { email }),
  verifyEmail: token => publicAction('/verification/confirm', { token }),
  requestPasswordReset: email => publicAction('/password-reset/request', { email }),
  resetPassword: data => publicAction('/password-reset/confirm', data),
  refresh: () => {
    if (!refreshPromise) {
      refreshPromise = request('/refresh', {}).finally(() => { refreshPromise = undefined; });
    }
    return refreshPromise;
  },
  logout: () => request('/logout', {}),
};
