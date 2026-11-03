import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  displayName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  role: { type: String, enum: ['student', 'teacher', 'employee', 'business'], required: true, default: 'student' },
  status: { type: String, enum: ['active', 'disabled'], default: 'active', required: true },
  emailVerifiedAt: { type: Date, default: null },
  emailVerificationTokenHash: { type: String, select: false, default: undefined },
  emailVerificationExpiresAt: { type: Date, select: false, default: undefined },
  emailVerificationSentAt: { type: Date, select: false, default: undefined },
  passwordResetTokenHash: { type: String, select: false, default: undefined },
  passwordResetExpiresAt: { type: Date, select: false, default: undefined },
  passwordResetSentAt: { type: Date, select: false, default: undefined },
}, { timestamps: true, versionKey: false });

userSchema.index({ emailVerificationTokenHash: 1 }, { unique: true, sparse: true });
userSchema.index({ passwordResetTokenHash: 1 }, { unique: true, sparse: true });

export const User = mongoose.model('User', userSchema);
