import { z } from 'zod';

export const addWebsiteSourceSchema = z.object({ url: z.string().trim().min(8).max(2048).url() }).strict();
