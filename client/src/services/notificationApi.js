const BASE = '/api/v1/notifications';

async function send(path, { token, refreshAccessToken }, method = 'GET', body) {
  const request = accessToken => fetch(`${BASE}${path}`, {
    method, credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let response = await request(token);
  if (response.status === 401) response = await request(await refreshAccessToken());
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error?.message || 'Notifications could not be loaded.');
  return result;
}
export const notificationApi = {
  list: auth => send('', auth),
  async markRead(id, auth) { return (await send(`/${id}/read`, auth, 'PATCH', {})).item; },
};
