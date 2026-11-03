import { z } from 'zod';

const id = z.string().regex(/^[a-f\d]{24}$/i);

export const generateFlashcardsSchema = z.object({
  documentIds: z.array(id).max(30).default([]),
  websiteSourceIds: z.array(id).max(30).default([]),
  cardCount: z.number().int().min(3).max(20).default(10),
}).strict();
