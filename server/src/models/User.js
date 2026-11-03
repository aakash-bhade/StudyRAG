import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  role: { type: String, enum: ['student', 'teacher', 'employee', 'business'], required: true, default: 'student' },
  status: { type: String, enum: ['active', 'disabled'], default: 'active', required: true },
}, { timestamps: true, versionKey: false });

export const User = mongoose.model('User', userSchema);
