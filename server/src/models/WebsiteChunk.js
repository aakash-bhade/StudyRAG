import mongoose from 'mongoose';

const websiteChunkSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'WebsiteSource', required: true },
  ordinal: { type: Number, required: true, min: 0 },
  text: { type: String, required: true, maxlength: 1600 },
}, { timestamps: true, versionKey: false });

websiteChunkSchema.index({ ownerId: 1, sourceId: 1, ordinal: 1 }, { unique: true });
export const WebsiteChunk = mongoose.model('WebsiteChunk', websiteChunkSchema);
