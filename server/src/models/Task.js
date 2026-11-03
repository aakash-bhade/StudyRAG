import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  details: { type: String, trim: true, maxlength: 2000, default: '' },
  dueAt: { type: Date, default: null },
  status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
}, { timestamps: true, versionKey: false });

taskSchema.index({ ownerId: 1, status: 1, dueAt: 1 });
taskSchema.index({ ownerId: 1, updatedAt: -1 });
export const Task = mongoose.model('Task', taskSchema);
