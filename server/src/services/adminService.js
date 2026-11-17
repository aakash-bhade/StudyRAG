import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { Document } from '../models/Document.js';
import { Note } from '../models/Note.js';
import { WebsiteSource } from '../models/WebsiteSource.js';
import { Quiz } from '../models/Quiz.js';
import { Assignment } from '../models/Assignment.js';
import { Task } from '../models/Task.js';
import { FlashcardDeck } from '../models/FlashcardDeck.js';
import { storageProvider } from '../config/storage.js';
import { databaseState } from '../config/database.js';
import { AdminActivity } from '../models/AdminActivity.js';

export async function getAdminOverview({ page = 1, limit = 25, query = '' } = {}) {
  const filter = {};
  if (query) {
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [{ displayName: { $regex: escaped, $options: 'i' } }, { email: { $regex: escaped, $options: 'i' } }];
  }
  const skip = (page - 1) * limit;
  const [users, totalUsers, allUsers, activeSessions, documents, notes, websites, quizzes, assignments, tasks, flashcardDecks, recentSignIns, recentActions] = await Promise.all([
    User.find(filter).select('displayName email role status createdAt lastLoginAt').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
    User.countDocuments(),
    Session.countDocuments({ revokedAt: null, expiresAt: { $gt: new Date() } }),
    Document.countDocuments(), Note.countDocuments({ deletedAt: null }), WebsiteSource.countDocuments(), Quiz.countDocuments(), Assignment.countDocuments(), Task.countDocuments(), FlashcardDeck.countDocuments(),
    Session.find({}).sort({ createdAt: -1 }).limit(12).populate('userId', 'displayName email role').lean(),
    AdminActivity.find({}).sort({ createdAt: -1 }).limit(20).populate('userId', 'displayName email role').lean(),
  ]);
  const loginTimes = await Session.aggregate([
    { $match: { userId: { $in: users.map(user => user._id) } } },
    { $group: { _id: '$userId', lastLoginAt: { $max: '$createdAt' } } },
  ]);
  const latestLoginByUser = new Map(loginTimes.map(item => [String(item._id), item.lastLoginAt]));
  return {
    stats: { users: allUsers, activeSessions, documents, notes, websites, quizzes, assignments, tasks, flashcardDecks },
    system: { database: databaseState(), fileStorage: storageProvider() },
    users: users.map(user => ({ id: String(user._id), displayName: user.displayName, email: user.email, role: user.role, status: user.status, joinedAt: user.createdAt, lastLoginAt: user.lastLoginAt || latestLoginByUser.get(String(user._id)) || null })),
    recentSignIns: recentSignIns.filter(session => session.userId).map(session => ({ id: String(session._id), user: { name: session.userId.displayName, email: session.userId.email }, signedInAt: session.createdAt })),
    recentActions: recentActions.filter(activity => activity.userId).map(activity => ({ id: String(activity._id), user: { name: activity.userId.displayName, email: activity.userId.email }, action: activity.action, happenedAt: activity.createdAt })),
    pagination: { page, limit, total: totalUsers, pages: Math.ceil(totalUsers / limit) },
  };
}
