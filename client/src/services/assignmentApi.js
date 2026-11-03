const BASE = '/api/v1/assignments';

async function send(path, { token, refreshAccessToken }, method = 'GET', body) {
  const request = accessToken => fetch(`${BASE}${path}`, {
    method, credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let response = await request(token);
  if (response.status === 401) response = await request(await refreshAccessToken());
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error?.message || 'This assignment request could not be completed.');
  return result;
}
export const assignmentApi = {
  async list(auth) { return (await send('', auth)).items; },
  async create(data, auth) { return (await send('', auth, 'POST', data)).item; },
  async update(id, data, auth) { return (await send(`/${id}`, auth, 'PATCH', data)).item; },
  async submit(id, response, auth) { return (await send(`/${id}/submit`, auth, 'POST', { response })).item; },
  async remove(id, auth) { return send(`/${id}`, auth, 'DELETE'); },
};
