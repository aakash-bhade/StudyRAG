import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  displayName: { type: String, required: true, trim: true, maxlength: 180 },
  originalName: { type: String, required: true, maxlength: 255 },
  storageKey: { type: String, required: true, unique: true, select: false },
  mimeType: { type: String, required: true, enum: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'] },
  byteSize: { type: Number, required: true, min: 1 },
  status: { type: String, required: true, enum: ['ready'], default: 'ready' },
  pageCount: { type: Number, default: null, min: 1 },
  chunkCount: { type: Number, required: true, min: 1 },
  contentHash: { type: String, required: true, select: false },
}, { timestamps: true, versionKey: false });

documentSchema.index({ ownerId: 1, createdAt: -1 });
documentSchema.index({ ownerId: 1, displayName: 1 });

export const Document = mongoose.model('Document', documentSchema);
