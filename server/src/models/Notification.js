import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  key: { type: String, required: true, maxlength: 80 },
  sourceType: { type: String, enum: ['task', 'assignment'], required: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true, maxlength: 180 },
  body: { type: String, required: true, maxlength: 200 },
  href: { type: String, enum: ['/app/tasks', '/app/assignments'], required: true },
  dueAt: { type: Date, required: true },
  readAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

notificationSchema.index({ ownerId: 1, key: 1 }, { unique: true });
notificationSchema.index({ ownerId: 1, dueAt: 1, readAt: 1 });
export const Notification = mongoose.model('Notification', notificationSchema);
