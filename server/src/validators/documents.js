import { z } from 'zod';

export const documentListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(120).optional().default(''),
}).strict();

export const renameDocumentSchema = z.object({
  displayName: z.string().trim().min(1).max(180),
}).strict();

export function validateQuery(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(Object.assign(new Error('Please check the document list filters.'), { status: 400, code: 'VALIDATION_ERROR', details: result.error.flatten().fieldErrors }));
    }
    req.validatedQuery = result.data;
    next();
  };
}
