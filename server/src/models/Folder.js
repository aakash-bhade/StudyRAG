import mongoose from 'mongoose';

const folderSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, lowercase: true, maxlength: 48 },
}, { timestamps: true, versionKey: false });

folderSchema.index({ ownerId: 1, name: 1 }, { unique: true });
export const Folder = mongoose.model('Folder', folderSchema);
