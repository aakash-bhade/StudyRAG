import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: undefined },
  websiteSourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteSource', default: undefined },
  url: { type: String, maxlength: 2048, default: undefined },
  sourceType: { type: String, enum: ['document', 'website'], required: true },
  documentName: { type: String, required: true, maxlength: 180 },
  ordinal: { type: Number, required: true, min: 0 },
  page: { type: Number, default: null, min: 1 },
  excerpt: { type: String, required: true, maxlength: 1600 },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true, maxlength: 12000 },
  notice: { type: String, maxlength: 1200, default: undefined },
  citations: { type: [citationSchema], default: [] },
  answerMode: { type: String, enum: ['ollama', 'retrieval-only', 'no-match'], default: undefined },
}, { timestamps: { createdAt: true, updatedAt: false }, versionKey: false });

messageSchema.index({ ownerId: 1, conversationId: 1, createdAt: 1 });
export const Message = mongoose.model('Message', messageSchema);
