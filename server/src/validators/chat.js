import { z } from 'zod';

export const questionSchema = z.object({
  question: z.string().trim().min(3, 'Ask a question with at least 3 characters.').max(1200, 'Questions must be 1,200 characters or fewer.'),
  documentIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(50).optional(),
  conversationId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
});
