const BASE = '/api/v1/chat';

export const chatApi = {
  async ask(question, documentIds, conversationId, { token, refreshAccessToken }, websiteSourceIds = [], noteIds = []) {
    const send = accessToken => fetch(`${BASE}/ask`, {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, documentIds, websiteSourceIds, noteIds, ...(conversationId ? { conversationId } : {}) }),
    });
    let response = await send(token);
    if (response.status === 401) response = await send(await refreshAccessToken());
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error?.message || 'Your question could not be answered.');
    return result;
  },
  async list({ token, refreshAccessToken }) {
    return request('/conversations', { token, refreshAccessToken });
  },
  async get(id, { token, refreshAccessToken }) {
    const result = await request(`/conversations/${id}`, { token, refreshAccessToken });
    return result.item;
  },
  async rename(id, title, auth) {
    const result = await request(`/conversations/${id}`, auth, { method: 'PATCH', body: JSON.stringify({ title }) });
    return result.item;
  },
  async remove(id, auth) {
    return request(`/conversations/${id}`, auth, { method: 'DELETE' });
  },
};

async function request(path, { token, refreshAccessToken }, options = {}) {
  const send = accessToken => fetch(`${BASE}${path}`, { credentials: 'include', ...options, headers: { Authorization: `Bearer ${accessToken}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers } });
  let response = await send(token);
  if (response.status === 401) response = await send(await refreshAccessToken());
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error?.message || 'Your conversation could not be loaded.');
  return result;
}
