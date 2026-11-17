const BASE = '/api/v1/quizzes';

async function request(path, { token, refreshAccessToken, method = 'GET', body } = {}) {
  const send = accessToken => fetch(`${BASE}${path}`, { method, credentials: 'include', headers: { Authorization: `Bearer ${accessToken}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  let response = await send(token);
  if (response.status === 401) response = await send(await refreshAccessToken());
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error?.message || result.message || 'This quiz request could not be completed.');
  return result;
}

export const quizApi = {
  list: auth => request('', auth),
  generate: (options, auth) => request('/generate', { ...auth, method: 'POST', body: options }),
  get: (id, auth) => request(`/${id}`, auth),
  delete: (id, auth) => request(`/${id}`, { ...auth, method: 'DELETE' }),
  submit: (id, answers, auth) => request(`/${id}/attempts`, { ...auth, method: 'POST', body: { answers } }),
};
