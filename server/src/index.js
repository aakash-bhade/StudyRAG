import { app } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { ensureDocumentStorage } from './config/storage.js';

try {
  await ensureDocumentStorage();
  await connectDatabase();
  const server = app.listen(env.PORT, '0.0.0.0', () => console.log(`StudyRAG API listening on port ${env.PORT}`));
  const shutdown = signal => {
    console.log(`${signal} received; closing server.`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
} catch (error) {
  console.error('Could not connect to MongoDB. Check MONGODB_URI and database network access.');
  if (env.NODE_ENV !== 'production') console.error(error.message);
  process.exit(1);
}
