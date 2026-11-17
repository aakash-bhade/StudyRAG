import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  FRONTEND_ORIGIN: z.string().url().default('http://localhost:5173'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false'),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  DOCUMENT_STORAGE_DIR: z.string().optional(),
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  S3_ENDPOINT: z.preprocess(value => value === '' ? undefined : value, z.string().url().optional()),
  S3_REGION: z.string().trim().min(1).default('auto'),
  S3_BUCKET: z.preprocess(value => value === '' ? undefined : value, z.string().trim().min(1).optional()),
  S3_ACCESS_KEY_ID: z.preprocess(value => value === '' ? undefined : value, z.string().trim().min(1).optional()),
  S3_SECRET_ACCESS_KEY: z.preprocess(value => value === '' ? undefined : value, z.string().min(1).optional()),
  GROQ_API_KEY: z.preprocess(value => value === '' ? undefined : value, z.string().trim().min(1).optional()),
  GROQ_MODEL: z.preprocess(value => value === '' ? undefined : value, z.string().trim().min(1).default('openai/gpt-oss-20b')),
  SMTP_HOST: z.preprocess(value => value === '' ? undefined : value, z.string().trim().min(1).optional()),
  SMTP_PORT: z.preprocess(value => value === '' || value === undefined ? undefined : Number(value), z.number().int().min(1).max(65535).optional()),
  SMTP_USER: z.preprocess(value => value === '' ? undefined : value, z.string().trim().min(1).optional()),
  SMTP_PASS: z.preprocess(value => value === '' ? undefined : value, z.string().min(1).optional()),
  SMTP_FROM: z.preprocess(value => value === '' ? undefined : value, z.string().trim().email().optional()),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid server environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  cookieSecure: parsed.data.COOKIE_SECURE === 'true' || parsed.data.NODE_ENV === 'production',
  cookieSameSite: parsed.data.COOKIE_SAME_SITE,
  smtpConfigured: Boolean(parsed.data.SMTP_HOST && parsed.data.SMTP_PORT && parsed.data.SMTP_FROM),
  s3Configured: Boolean(parsed.data.S3_BUCKET && parsed.data.S3_ACCESS_KEY_ID && parsed.data.S3_SECRET_ACCESS_KEY),
};

if (env.STORAGE_PROVIDER === 's3' && (!env.s3Configured || !env.S3_ENDPOINT)) {
  console.error('STORAGE_PROVIDER=s3 requires S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY.');
  process.exit(1);
}
if (env.NODE_ENV === 'production' && env.STORAGE_PROVIDER !== 's3') {
  console.error('Production requires STORAGE_PROVIDER=s3 with durable private object storage. Local disk is development-only.');
  process.exit(1);
}

const smtpFields = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_FROM'];
if ((smtpFields.some(field => parsed.data[field] !== undefined) || parsed.data.SMTP_USER !== undefined || parsed.data.SMTP_PASS !== undefined)
  && !smtpFields.every(field => parsed.data[field] !== undefined)) {
  console.error('SMTP_HOST, SMTP_PORT, and SMTP_FROM must be configured together.');
  process.exit(1);
}
if ((parsed.data.SMTP_USER === undefined) !== (parsed.data.SMTP_PASS === undefined)) {
  console.error('SMTP_USER and SMTP_PASS must be configured together.');
  process.exit(1);
}

if (env.cookieSameSite === 'none' && !env.cookieSecure) {
  console.error('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true.');
  process.exit(1);
}
