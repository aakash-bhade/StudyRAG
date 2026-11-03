import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  selectedIndex: { type: Number, min: 0, max: 3, default: null },
  correctIndex: { type: Number, required: true, min: 0, max: 3 },
  isCorrect: { type: Boolean, required: true },
  explanation: { type: String, required: true, maxlength: 1200 },
}, { _id: false });

const quizAttemptSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: { type: [resultSchema], required: true },
  score: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 1 },
  completedAt: { type: Date, required: true, default: Date.now },
}, { versionKey: false });

quizAttemptSchema.index({ ownerId: 1, quizId: 1, completedAt: -1 });
export const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
