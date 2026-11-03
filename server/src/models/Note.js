import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  body: { type: String, required: true, maxlength: 10000 },
  tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 24 }], default: [] },
  deletedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

noteSchema.index({ ownerId: 1, updatedAt: -1 });
noteSchema.index({ ownerId: 1, title: 1 });
export const Note = mongoose.model('Note', noteSchema);
