import { AdminActivity } from '../models/AdminActivity.js';

const labels = {
  documents: 'document', notes: 'note', folders: 'folder', flashcards: 'flashcard deck', sources: 'website source',
  quizzes: 'quiz', tasks: 'study task', assignments: 'assignment', 'saved-items': 'saved item', notifications: 'notification', chat: 'chat',
};

export function trackActivity(req, res, next) {
  const userId = req.user?._id;
  const resource = labels[req.baseUrl.split('/').filter(Boolean).at(-1)] || 'workspace item';
  res.once('finish', () => {
    if (!userId || !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || res.statusCode < 200 || res.statusCode >= 400) return;
    const verb = req.method === 'POST' ? (resource === 'chat' ? 'asked the study assistant' : `created or added a ${resource}`)
      : req.method === 'DELETE' ? `deleted a ${resource}`
        : req.method === 'PATCH' ? `updated a ${resource}` : `changed a ${resource}`;
    void AdminActivity.create({ userId, action: verb }).catch(() => {});
  });
  next();
}
