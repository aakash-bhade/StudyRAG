import { z } from 'zod';

const dueDate = z.union([z.string().datetime({ offset: true }), z.literal(''), z.null()]).optional().transform(value => value || null);
export const assignmentSchema = z.object({
  title: z.string().trim().min(1, 'Add an assignment title.').max(160),
  instructions: z.string().trim().min(1, 'Add the assignment instructions.'),
  dueAt: dueDate,
  status: z.enum(['assigned', 'in_progress']).optional().default('assigned'),
  response: z.string().trim().max(10000).optional().default(''),
}).strict();

export const submissionSchema = z.object({
  response: z.string().trim().min(1, 'Write your response before marking this submitted.').max(10000),
}).strict();
