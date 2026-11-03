const BASE = '/api/v1/chat';

export const chatApi = {
  async ask(question, documentIds, { token, refreshAccessToken }) {
    const send = accessToken => fetch(`${BASE}/ask`, {
      method: 'POST',
      credentials: 'include',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, ...(documentIds.length ? { documentIds } : {}) }),
    });
    let response = await send(token);
    if (response.status === 401) response = await send(await refreshAccessToken());
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error?.message || 'Your question could not be answered.');
    return result.item;
  },
};
