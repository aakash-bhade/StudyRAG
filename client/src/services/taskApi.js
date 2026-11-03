const BASE = '/api/v1/tasks';

async function send(path, { token, refreshAccessToken }, method = 'GET', body) {
  const request = accessToken => fetch(`${BASE}${path}`, {
    method, credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let response = await request(token);
  if (response.status === 401) response = await request(await refreshAccessToken());
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error?.message || 'This task request could not be completed.');
  return result;
}

export const taskApi = {
  async list(auth) { return (await send('', auth)).items; },
  async create(task, auth) { return (await send('', auth, 'POST', task)).item; },
  async update(id, task, auth) { return (await send(`/${id}`, auth, 'PATCH', task)).item; },
  async remove(id, auth) { return send(`/${id}`, auth, 'DELETE'); },
};
