import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  instructions: { type: String, required: true, trim: true, maxlength: 5000 },
  dueAt: { type: Date, default: null },
  status: { type: String, enum: ['assigned', 'in_progress', 'submitted'], default: 'assigned' },
  response: { type: String, trim: true, maxlength: 10000, default: '' },
  submittedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

assignmentSchema.index({ ownerId: 1, status: 1, dueAt: 1 });
assignmentSchema.index({ ownerId: 1, updatedAt: -1 });
export const Assignment = mongoose.model('Assignment', assignmentSchema);
