const BASE = '/api/v1/sources';

async function request(path, { token, refreshAccessToken, method = 'GET', body } = {}) {
  const send = accessToken => fetch(`${BASE}${path}`, { method, credentials: 'include', headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  let response = await send(token);
  if (response.status === 401) response = await send(await refreshAccessToken());
  if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.error?.message || 'This website source request could not be completed.'); }
  return response.json();
}

export const sourceApi = {
  list: auth => request('', auth),
  add: (url, auth) => request('', { ...auth, method: 'POST', body: { url } }),
  remove: (id, auth) => request(`/${id}`, { ...auth, method: 'DELETE' }),
};
