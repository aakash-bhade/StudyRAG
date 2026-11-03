import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  front: { type: String, required: true, maxlength: 240 },
  back: { type: String, required: true, maxlength: 1200 },
}, { _id: false });

const flashcardDeckSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, maxlength: 160 },
  sourceNames: { type: [String], default: [] },
  cards: { type: [cardSchema], required: true, validate: value => value.length >= 3 && value.length <= 20 },
}, { timestamps: true, versionKey: false });

flashcardDeckSchema.index({ ownerId: 1, createdAt: -1 });
export const FlashcardDeck = mongoose.model('FlashcardDeck', flashcardDeckSchema);
