import { listNotifications, markNotificationRead } from '../services/notificationService.js';

export async function listNotificationsAction(req, res, next) {
  try { res.json(await listNotifications(req.user._id)); } catch (error) { next(error); }
}
export async function markNotificationReadAction(req, res, next) {
  try { res.json({ item: await markNotificationRead(req.user._id, req.params.id) }); } catch (error) { next(error); }
}
