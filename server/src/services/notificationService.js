import mongoose from 'mongoose';
import { httpError } from '../middleware/errors.js';
import { Assignment } from '../models/Assignment.js';
import { Notification } from '../models/Notification.js';
import { Task } from '../models/Task.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function reminderText(dueAt, now = Date.now()) {
  const delta = dueAt.getTime() - now;
  if (delta < -DAY_MS) return `Overdue by ${Math.ceil(Math.abs(delta) / DAY_MS)} day${Math.ceil(Math.abs(delta) / DAY_MS) === 1 ? '' : 's'}.`;
  if (delta < 0) return 'Due now. Add it to your plan today.';
  const days = Math.ceil(delta / DAY_MS);
  return days <= 1 ? 'Due within 24 hours.' : `Due in ${days} days.`;
}

async function syncSource(ownerId, sourceType, records, href) {
  const ids = records.map(record => record._id);
  for (const record of records) {
    const dueAt = new Date(record.dueAt);
    const key = `${sourceType}:${record._id}`;
    const filter = { ownerId, key };
    try {
      await Notification.findOneAndUpdate(filter, { $set: {
        sourceType, sourceId: record._id, title: record.title, body: reminderText(dueAt), href, dueAt,
      }, $setOnInsert: { ownerId, key, readAt: null } }, { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true });
    } catch (error) {
      if (error.code !== 11000) throw error;
      await Notification.updateOne(filter, { $set: { title: record.title, body: reminderText(dueAt), dueAt } });
    }
  }
  await Notification.deleteMany({ ownerId, sourceType, sourceId: { $nin: ids } });
}

function serialize(item) {
  return { id: String(item._id), type: item.sourceType, sourceId: String(item.sourceId), title: item.title, body: item.body, href: item.href, dueAt: item.dueAt, readAt: item.readAt, createdAt: item.createdAt };
}

export async function listNotifications(ownerId) {
  const horizon = new Date(Date.now() + 7 * DAY_MS);
  const [tasks, assignments] = await Promise.all([
    Task.find({ ownerId, status: { $ne: 'done' }, dueAt: { $ne: null, $lte: horizon } }).select('_id title dueAt').lean(),
    Assignment.find({ ownerId, status: { $ne: 'submitted' }, dueAt: { $ne: null, $lte: horizon } }).select('_id title dueAt').lean(),
  ]);
  await syncSource(ownerId, 'task', tasks, '/app/tasks');
  await syncSource(ownerId, 'assignment', assignments, '/app/assignments');
  const [items, unreadCount] = await Promise.all([
    Notification.find({ ownerId }).sort({ readAt: 1, dueAt: 1 }).limit(100).lean(),
    Notification.countDocuments({ ownerId, readAt: null }),
  ]);
  return { items: items.map(serialize), unreadCount };
}

export async function markNotificationRead(ownerId, id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'INVALID_ID', 'The notification ID is invalid.');
  const item = await Notification.findOneAndUpdate({ _id: id, ownerId }, { $set: { readAt: new Date() } }, { new: true });
  if (!item) throw httpError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
  return serialize(item);
}
