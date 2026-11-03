const BASE = '/api/v1/chat';

export const chatApi = {
  async ask(question, documentIds, conversationId, { token, refreshAccessToken }, websiteSourceIds = []) {
    const send = accessToken => fetch(`${BASE}/ask`, {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, documentIds, websiteSourceIds, ...(conversationId ? { conversationId } : {}) }),
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
};

async function request(path, { token, refreshAccessToken }) {
  const send = accessToken => fetch(`${BASE}${path}`, { credentials: 'include', headers: { Authorization: `Bearer ${accessToken}` } });
  let response = await send(token);
  if (response.status === 401) response = await send(await refreshAccessToken());
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error?.message || 'Your conversation could not be loaded.');
  return result;
}
