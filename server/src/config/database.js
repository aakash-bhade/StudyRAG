import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  return mongoose.connection;
}

export function databaseState() {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}
