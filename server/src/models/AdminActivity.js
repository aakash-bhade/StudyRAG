import mongoose from 'mongoose';

const adminActivitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { type: String, required: true, maxlength: 100 },
  createdAt: { type: Date, default: Date.now, index: true },
}, { versionKey: false });

adminActivitySchema.index({ createdAt: -1 });
export const AdminActivity = mongoose.model('AdminActivity', adminActivitySchema);
