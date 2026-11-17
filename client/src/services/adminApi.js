const BASE = '/api/v1/admin';

export const adminApi = {
  async overview({ token, refreshAccessToken, query = '', page = 1 }) {
    const request = accessToken => fetch(`${BASE}/overview?${new URLSearchParams({ page: String(page), limit: '25', ...(query ? { q: query } : {}) })}`, {
      credentials: 'include', headers: { Authorization: `Bearer ${accessToken}` },
    });
    let response = await request(token);
    if (response.status === 401) response = await request(await refreshAccessToken());
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error?.message || 'Could not load the admin dashboard.');
    return result;
  },
};
