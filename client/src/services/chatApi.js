const BASE = '/api/v1/chat';

export const chatApi = {
  async ask(question, documentIds, conversationId, { token, refreshAccessToken }, websiteSourceIds = [], noteIds = [], onToken = () => {}) {
    const send = accessToken => fetch(`${BASE}/ask`, {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, documentIds, websiteSourceIds, noteIds, ...(conversationId ? { conversationId } : {}) }),
    });
    let response = await send(token);
    if (response.status === 401) response = await send(await refreshAccessToken());
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error?.message || 'Your question could not be answered.');
    }
    if (!response.body) throw new Error('The answer stream could not be opened. Please try again.');
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let result;
    const readLine = line => {
      if (!line.startsWith('data:')) return;
      const event = JSON.parse(line.slice(5).trim());
      if (event.token) onToken(event.token);
      if (event.error) throw new Error(event.error.message || 'Your question could not be answered.');
      if (event.result) result = event.result;
    };
    while (true) {
      const { value, done } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      let newline;
      while ((newline = buffer.indexOf('\n')) >= 0) {
        readLine(buffer.slice(0, newline).replace(/\r$/, ''));
        buffer = buffer.slice(newline + 1);
      }
      if (done) break;
    }
    if (buffer.trim()) readLine(buffer.replace(/\r$/, ''));
    if (!result) throw new Error('The answer stream ended before the answer was saved. Please try again.');
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
