import { z } from 'zod';

const passwordSchema = z.string().min(10).max(128).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be 72 bytes or fewer.');

export const registerSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: passwordSchema,
  role: z.enum(['student', 'teacher', 'employee', 'business']),
}).strict();

export const loginSchema = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(1).max(128).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be 72 bytes or fewer.'),
}).strict();

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(128).refine(value => Buffer.byteLength(value, 'utf8') <= 72),
  newPassword: passwordSchema,
}).strict();

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
}).strict();

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const error = Object.assign(new Error('Please check the information and try again.'), { status: 400, code: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors });
      return next(error);
    }
    req.body = result.data;
    next();
  };
}
