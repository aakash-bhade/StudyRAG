// Loading the complete Express app catches ESM export mismatches that `node --check`
// cannot detect, without requiring MongoDB or any external service.
process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/studyrag';
process.env.JWT_ACCESS_SECRET ||= 'runtime-smoke-access-secret-0123456789';
process.env.JWT_REFRESH_SECRET ||= 'runtime-smoke-refresh-secret-0123456789';
process.env.FRONTEND_ORIGIN ||= 'http://localhost:5173';

const { app } = await import('../src/app.js');
if (typeof app !== 'function' || typeof app.listen !== 'function') {
  throw new Error('Express application did not load correctly.');
}
console.log('Server runtime import smoke check passed.');
