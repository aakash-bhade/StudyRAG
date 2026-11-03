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

export const authApi = {
  login: data => request('/login', data),
  register: data => request('/register', data),
  refresh: () => {
    if (!refreshPromise) {
      refreshPromise = request('/refresh', {}).finally(() => { refreshPromise = undefined; });
    }
    return refreshPromise;
  },
  logout: () => request('/logout', {}),
};
