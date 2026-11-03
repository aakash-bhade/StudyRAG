import { z } from 'zod';

export const folderSchema = z.object({
  name: z.string().trim().min(1, 'Add a folder name.').max(48).transform(value => value.toLowerCase()),
}).strict();
