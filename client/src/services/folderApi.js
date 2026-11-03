const BASE = '/api/v1/folders';

async function send(path, { token, refreshAccessToken }, method = 'GET', body) {
  const request = accessToken => fetch(`${BASE}${path}`, { method, credentials: 'include', headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  let response = await request(token);
  if (response.status === 401) response = await request(await refreshAccessToken());
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error?.message || 'This folder request could not be completed.');
  return result;
}
export const folderApi = {
  async list(auth) { return (await send('', auth)).items; },
  async create(name, auth) { return (await send('', auth, 'POST', { name })).item; },
  async update(id, name, auth) { return (await send(`/${id}`, auth, 'PATCH', { name })).item; },
  async remove(id, auth) { return send(`/${id}`, auth, 'DELETE'); },
};
