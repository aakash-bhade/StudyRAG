import { z } from 'zod';

export const savedItemSchema = z.object({
  sourceType: z.enum(['document', 'website']),
  sourceId: z.string().regex(/^[a-f\d]{24}$/i, 'Source ID is invalid.'),
  ordinal: z.number().int().min(0),
  excerpt: z.string().trim().min(1).max(1600),
}).strict();
