import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema({
  prompt: { type: String, required: true, maxlength: 600 },
  options: { type: [String], required: true, validate: value => value.length === 4 },
  correctIndex: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String, required: true, maxlength: 1200 },
  sourceNames: { type: [String], default: [] },
}, { _id: false });

const quizSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, maxlength: 160 },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  sourceNames: { type: [String], default: [] },
  questions: { type: [quizQuestionSchema], required: true, validate: value => value.length >= 3 && value.length <= 10 },
}, { timestamps: true, versionKey: false });

quizSchema.index({ ownerId: 1, createdAt: -1 });
export const Quiz = mongoose.model('Quiz', quizSchema);
