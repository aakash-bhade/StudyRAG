import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  sourceFilters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  websiteSourceFilters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteSource' }],
  archivedAt: { type: Date, default: null },
}, { timestamps: true, versionKey: false });

conversationSchema.index({ ownerId: 1, updatedAt: -1 });
export const Conversation = mongoose.model('Conversation', conversationSchema);
