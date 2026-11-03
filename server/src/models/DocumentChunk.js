import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  ordinal: { type: Number, required: true, min: 0 },
  text: { type: String, required: true, maxlength: 1600 },
  page: { type: Number, default: null, min: 1 },
  embedding: { type: [Number], default: undefined, select: false },
  embeddingModel: { type: String, maxlength: 120, default: undefined, select: false },
}, { timestamps: true, versionKey: false });

documentChunkSchema.index({ ownerId: 1, documentId: 1, ordinal: 1 }, { unique: true });

export const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);
