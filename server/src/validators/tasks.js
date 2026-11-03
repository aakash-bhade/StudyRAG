import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Add a task title.').max(160),
  details: z.string().trim().max(2000).optional().default(''),
  dueAt: z.union([z.string().datetime({ offset: true }), z.literal(''), z.null()]).optional().transform(value => value || null),
  status: z.enum(['todo', 'in_progress', 'done']).optional().default('todo'),
}).strict();
