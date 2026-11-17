import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Usage: npm run admin:promote -- owner@example.com');
  process.exit(1);
}

try {
  await connectDatabase();
  const user = await User.findOneAndUpdate({ email }, { $set: { role: 'admin' } }, { returnDocument: 'after' });
  if (!user) throw new Error(`No account found for ${email}. Create the account first, then run this command.`);
  console.log(`Admin access enabled for ${user.displayName} (${user.email}). Sign out and sign back in to refresh your role.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
