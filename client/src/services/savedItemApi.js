const BASE = '/api/v1/saved-items';

async function send(path, { token, refreshAccessToken }, method = 'GET', body) {
  const request = accessToken => fetch(`${BASE}${path}`, {
    method, credentials: 'include', headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let response = await request(token);
  if (response.status === 401) response = await request(await refreshAccessToken());
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error?.message || 'This saved item request could not be completed.');
  return result;
}
export const savedItemApi = {
  async list(auth) { return (await send('', auth)).items; },
  async save(data, auth) { return (await send('', auth, 'POST', data)).item; },
  async remove(id, auth) { return send(`/${id}`, auth, 'DELETE'); },
};
