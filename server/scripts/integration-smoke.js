import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readFile, unlink, writeFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import { User } from '../src/models/User.js';
import { removeStoredDocument } from '../src/config/storage.js';

const api = `http://127.0.0.1:${process.env.PORT || 4000}/api/v1`;
const email = `studyrag-smoke-${randomUUID()}@example.test`;
const peerEmail = `studyrag-smoke-peer-${randomUUID()}@example.test`;
const tempFile = path.join(tmpdir(), `studyrag-smoke-${randomUUID()}.txt`);
const ownerIds = [];

async function request(route, { method = 'GET', token, json, form } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const options = { method, headers };
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(json);
  }
  if (form) options.body = form;
  const response = await fetch(`${api}${route}`, options);
  let body;
  if (response.headers.get('content-type')?.includes('text/event-stream')) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const events = [];
    let buffer = '';
    const readLine = line => {
      if (line.startsWith('data:')) events.push(JSON.parse(line.slice(5).trim()));
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
    if (route === '/chat/ask') assert.ok(events.some(event => event.token), 'The chat response should stream answer tokens before completion.');
    body = events.findLast(event => event.result || event.error);
    if (body?.result) body = body.result;
    else if (body?.error) body = { error: body.error };
  } else {
    body = await response.json();
  }
  assert.ok(response.ok, `${method} ${route} failed (${response.status}): ${body.error?.message || 'unknown error'}`);
  return body;
}

async function expectStatus(route, { method = 'GET', token, json } = {}, expectedStatus = 404) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const options = { method, headers };
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(json);
  }
  const response = await fetch(`${api}${route}`, options);
  assert.equal(response.status, expectedStatus, `${method} ${route} should return ${expectedStatus}, got ${response.status}`);
  return response.json();
}

async function cleanAccount() {
  if (!mongoose.connection.readyState) return;
  const users = await User.find({ $or: [{ _id: { $in: ownerIds } }, { email: { $in: [email, peerEmail] } }] }).lean();
  const collections = await mongoose.connection.db.listCollections({ type: 'collection' }).toArray();
  for (const user of users) {
    const documents = await mongoose.connection.db.collection('documents').find({ ownerId: user._id }, { projection: { storageKey: 1 } }).toArray();
    for (const document of documents) await removeStoredDocument(document.storageKey).catch(() => {});
    for (const { name } of collections) {
      if (name === 'users') continue;
      const collection = mongoose.connection.db.collection(name);
      await collection.deleteMany({ ownerId: user._id }).catch(() => {});
      await collection.deleteMany({ userId: user._id }).catch(() => {});
    }
    await User.deleteOne({ _id: user._id });
  }
}

try {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const health = await request('/health');
  assert.equal(health.status, 'ok');
  assert.equal(health.database, 'connected');

  const account = await request('/auth/register', {
    method: 'POST', json: { displayName: 'StudyRAG Smoke', email, password: 'LocalSmoke-8#Pass', role: 'student' },
  });
  ownerIds.push(account.user.id);
  const me = await request('/auth/me', { token: account.accessToken });
  assert.equal(me.user.id, account.user.id);
  const peer = await request('/auth/register', {
    method: 'POST', json: { displayName: 'StudyRAG Peer', email: peerEmail, password: 'LocalSmoke-8#Pass', role: 'employee' },
  });
  ownerIds.push(peer.user.id);

  const folder = await request('/folders', {
    method: 'POST', token: account.accessToken, json: { name: 'Biology' },
  });
  const noteText = 'Chlorophyll is the green pigment in chloroplasts that absorbs light energy. Photosynthesis converts water and carbon dioxide into glucose and oxygen using sunlight. The light reactions occur in the thylakoid membranes; the Calvin cycle fixes carbon in the stroma.';
  const note = await request('/notes', {
    method: 'POST', token: account.accessToken,
    json: { title: 'Photosynthesis facts', body: noteText, tags: ['biology'], folderId: folder.item.id },
  });

  const paragraph = 'Photosynthesis in plants uses chlorophyll, a green pigment located in chloroplasts, to capture sunlight. Plants use light energy to convert water and carbon dioxide into glucose and oxygen. The light reactions happen in the thylakoid membranes and the Calvin cycle fixes carbon in the stroma.';
  await writeFile(tempFile, Array(20).fill(paragraph).join('\n'), 'utf8');
  const form = new FormData();
  form.set('file', new Blob([await readFile(tempFile)], { type: 'text/plain' }), 'biology-smoke.txt');
  const uploaded = await request('/documents', { method: 'POST', token: account.accessToken, form });
  const documentId = uploaded.item.id;
  assert.ok(uploaded.item.chunkCount >= 3);
  await expectStatus(`/documents/${documentId}/download`, { token: peer.accessToken }, 404);
  await expectStatus('/chat/ask', {
    method: 'POST', token: peer.accessToken,
    json: { question: 'Which pigment captures sunlight?', documentIds: [documentId] },
  }, 404);

  const indexed = await request(`/documents/${documentId}/embeddings`, { method: 'POST', token: account.accessToken, json: {} });
  assert.equal(indexed.item.indexedChunkCount, uploaded.item.chunkCount);

  const website = await request('/sources', {
    method: 'POST', token: account.accessToken, json: { url: 'https://example.com/' },
  });
  const websiteId = website.item.id;
  const refreshed = await request(`/sources/${websiteId}/refresh`, { method: 'POST', token: account.accessToken, json: {} });
  assert.ok(refreshed.item.chunkCount > 0);
  const websiteIndex = await request(`/sources/${websiteId}/embeddings`, { method: 'POST', token: account.accessToken, json: {} });
  assert.ok(websiteIndex.item.indexedChunkCount > 0);

  const chat = await request('/chat/ask', {
    method: 'POST', token: account.accessToken,
    json: { question: 'Which pigment captures sunlight in photosynthesis?', documentIds: [documentId], websiteSourceIds: [websiteId], noteIds: [note.item.id] },
  });
  assert.equal(chat.item.answerMode, 'ollama');
  assert.ok(chat.item.sources.length > 0);
  const conversationId = chat.conversation.id;
  await expectStatus(`/chat/conversations/${conversationId}`, { token: peer.accessToken }, 404);
  const documentCitation = chat.item.sources.find(source => source.sourceType === 'document');
  assert.ok(documentCitation);
  const saved = await request('/saved-items', {
    method: 'POST', token: account.accessToken,
    json: { sourceType: 'document', sourceId: documentId, ordinal: documentCitation.ordinal, excerpt: documentCitation.text },
  });
  const renamed = await request(`/chat/conversations/${conversationId}`, {
    method: 'PATCH', token: account.accessToken, json: { title: 'Biology smoke conversation' },
  });
  assert.equal(renamed.item.title, 'Biology smoke conversation');

  const quiz = await request('/quizzes/generate', {
    method: 'POST', token: account.accessToken,
    json: { documentIds: [documentId], websiteSourceIds: [], difficulty: 'easy', questionCount: 3 },
  });
  assert.equal(quiz.item.questionCount, 3);
  const attempt = await request(`/quizzes/${quiz.item.id}/attempts`, {
    method: 'POST', token: account.accessToken, json: { answers: [0, 0, 0] },
  });
  assert.equal(attempt.item.total, 3);

  const deck = await request('/flashcards/generate', {
    method: 'POST', token: account.accessToken,
    json: { documentIds: [documentId], websiteSourceIds: [websiteId], cardCount: 3 },
  });
  assert.equal(deck.item.cardCount, 3);

  const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const task = await request('/tasks', {
    method: 'POST', token: account.accessToken,
    json: { title: 'Review photosynthesis', details: 'Smoke task', dueAt, status: 'todo' },
  });
  const updatedTask = await request(`/tasks/${task.item.id}`, {
    method: 'PATCH', token: account.accessToken,
    json: { title: 'Review photosynthesis', details: 'Smoke task', dueAt, status: 'in_progress' },
  });
  assert.equal(updatedTask.item.status, 'in_progress');
  const assignment = await request('/assignments', {
    method: 'POST', token: account.accessToken,
    json: { title: 'Explain photosynthesis', instructions: 'Describe how chlorophyll uses sunlight.', dueAt },
  });
  const submitted = await request(`/assignments/${assignment.item.id}/submit`, {
    method: 'POST', token: account.accessToken,
    json: { response: 'Chlorophyll absorbs sunlight to power photosynthesis.' },
  });
  assert.equal(submitted.item.status, 'submitted');
  const notifications = await request('/notifications', { token: account.accessToken });
  assert.ok(notifications.items.some(item => item.type === 'task' && item.sourceId === task.item.id));
  const readNotification = notifications.items.find(item => item.type === 'task' && item.sourceId === task.item.id);
  await request(`/notifications/${readNotification.id}/read`, { method: 'PATCH', token: account.accessToken, json: {} });

  await request(`/chat/conversations/${conversationId}`, { method: 'DELETE', token: account.accessToken });
  console.log(JSON.stringify({
    health: 'connected', account: 'register/me passed', isolation: 'cross-user documents and conversations denied', folder: 'created', note: 'created in folder',
    document: `uploaded and indexed ${indexed.item.indexedChunkCount} chunks`,
    website: `added, refreshed, and indexed ${websiteIndex.item.indexedChunkCount} chunks`,
    chat: `${chat.item.answerMode}/${chat.item.retrievalMode} with ${chat.item.sources.length} citations`,
    quiz: `generated ${quiz.item.questionCount}; attempt persisted`,
    flashcards: `generated ${deck.item.cardCount}`, savedPassage: 'saved',
    task: 'created and updated', assignment: 'created and submitted', notifications: 'created and marked read',
  }, null, 2));
} finally {
  await cleanAccount();
  await unlink(tempFile).catch(() => {});
  await mongoose.disconnect();
}
