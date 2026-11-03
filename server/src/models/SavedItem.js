import mongoose from 'mongoose';

const savedItemSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sourceType: { type: String, enum: ['document', 'website'], required: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  ordinal: { type: Number, required: true, min: 0 },
  sourceName: { type: String, required: true, maxlength: 180 },
  url: { type: String, maxlength: 2048, default: undefined },
  page: { type: Number, default: null, min: 1 },
  excerpt: { type: String, required: true, maxlength: 1600 },
}, { timestamps: true, versionKey: false });

savedItemSchema.index({ ownerId: 1, createdAt: -1 });
savedItemSchema.index({ ownerId: 1, sourceType: 1, sourceId: 1, ordinal: 1 }, { unique: true });
export const SavedItem = mongoose.model('SavedItem', savedItemSchema);
