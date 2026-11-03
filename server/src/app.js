import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { databaseState } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import { errorHandler, notFound, requestId } from './middleware/errors.js';
import { originGuard } from './middleware/originGuard.js';

export const app = express();
app.disable('x-powered-by');
app.set('trust proxy', env.NODE_ENV === 'production' ? 1 : false);
app.use(requestId);
app.use(helmet());
app.use(cors({ origin: env.FRONTEND_ORIGIN, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '16kb', type: 'application/json' }));
app.use(cookieParser());
app.use(originGuard);

app.get('/api/v1/health', (_req, res) => {
  const db = databaseState();
  res.status(db === 'connected' ? 200 : 503).json({ status: db === 'connected' ? 'ok' : 'degraded', database: db });
});
app.use('/api/v1/auth', authRoutes);
app.use(notFound);
app.use(errorHandler);
