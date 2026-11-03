import { z } from 'zod';

const id = z.string().regex(/^[a-f\d]{24}$/i);
export const generateQuizSchema = z.object({
  documentIds: z.array(id).max(30).default([]),
  websiteSourceIds: z.array(id).max(30).default([]),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  questionCount: z.number().int().min(3).max(10).default(5),
}).strict();
export const quizAttemptSchema = z.object({ answers: z.array(z.number().int().min(0).max(3).nullable()).min(3).max(10) }).strict();
