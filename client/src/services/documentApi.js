const BASE = '/api/v1/documents';

async function authenticatedRequest(path, { token, refreshAccessToken, body, method = 'GET' }) {
  const send = accessToken => fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body instanceof FormData ? {} : body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
  });

  let response = await send(token);
  if (response.status === 401) {
    const nextToken = await refreshAccessToken();
    response = await send(nextToken);
  }
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error?.message || 'This document request could not be completed.');
  }
  return response;
}

export const documentApi = {
  async list({ token, refreshAccessToken, query = '' }) {
    const params = new URLSearchParams({ page: '1', limit: '50', ...(query ? { q: query } : {}) });
    const response = await authenticatedRequest(`?${params}`, { token, refreshAccessToken });
    return response.json();
  },
  async upload(file, { token, refreshAccessToken }) {
    const body = new FormData();
    body.append('file', file);
    const response = await authenticatedRequest('', { token, refreshAccessToken, method: 'POST', body });
    return response.json();
  },
  async rename(id, displayName, { token, refreshAccessToken }) {
    const response = await authenticatedRequest(`/${id}`, { token, refreshAccessToken, method: 'PATCH', body: { displayName } });
    return response.json();
  },
  async remove(id, { token, refreshAccessToken }) {
    const response = await authenticatedRequest(`/${id}`, { token, refreshAccessToken, method: 'DELETE' });
    return response.json();
  },
  async download(id, { token, refreshAccessToken }) {
    const response = await authenticatedRequest(`/${id}/download`, { token, refreshAccessToken });
    return response.blob();
  },
};
