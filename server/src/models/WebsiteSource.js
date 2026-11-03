import mongoose from 'mongoose';

const websiteSourceSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  url: { type: String, required: true, maxlength: 2048 },
  title: { type: String, required: true, maxlength: 180 },
  canonicalHost: { type: String, required: true, maxlength: 253 },
  status: { type: String, enum: ['ready'], default: 'ready', required: true },
  contentHash: { type: String, required: true, select: false },
  chunkCount: { type: Number, required: true, min: 1 },
  fetchedAt: { type: Date, required: true },
  refreshLock: { type: String, default: null, select: false },
  refreshLockAt: { type: Date, default: null, select: false },
}, { timestamps: true, versionKey: false });

websiteSourceSchema.index({ ownerId: 1, createdAt: -1 });
export const WebsiteSource = mongoose.model('WebsiteSource', websiteSourceSchema);
