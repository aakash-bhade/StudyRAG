import { z } from 'zod';

export const noteSchema = z.object({
  title: z.string().trim().min(1, 'Add a title for this note.').max(120),
  body: z.string().trim().min(1, 'Write something in your note.').max(10000),
  tags: z.array(z.string().trim().min(1).max(24)).max(10).optional().default([]),
}).strict();

export const noteListSchema = z.object({
  q: z.string().trim().max(100).optional().default(''),
}).strict();
