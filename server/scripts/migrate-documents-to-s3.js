import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { Document } from '../src/models/Document.js';
import { putStoredDocument, readLocalStoredDocument, storedDocumentExists, storageProvider } from '../src/config/storage.js';

if (storageProvider() !== 's3') {
  console.error('Set STORAGE_PROVIDER=s3 and configure bucket credentials before migrating files.');
  process.exit(1);
}

try {
  await connectDatabase();
  const documents = await Document.find({}).select('+storageKey').lean();
  let migrated = 0;
  for (const document of documents) {
    try {
      if (await storedDocumentExists(document.storageKey)) continue;
    } catch { /* Missing objects are copied from the local storage directory below. */ }
    const data = await readLocalStoredDocument(document.storageKey);
    await putStoredDocument(document.storageKey, data);
    migrated += 1;
    console.log(`Migrated ${document.displayName} (${migrated}/${documents.length})`);
  }
  console.log(`Document migration finished: ${migrated} copied, ${documents.length - migrated} already present.`);
  console.log(`Local storage path: ${env.DOCUMENT_STORAGE_DIR || 'server/storage/documents'}`);
} catch (error) {
  console.error(`Document migration stopped: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
