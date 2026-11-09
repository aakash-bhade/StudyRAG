import { Assignment } from '../models/Assignment.js';
import { Conversation } from '../models/Conversation.js';
import { Document } from '../models/Document.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { Folder } from '../models/Folder.js';
import { FlashcardDeck } from '../models/FlashcardDeck.js';
import { Message } from '../models/Message.js';
import { Note } from '../models/Note.js';
import { Notification } from '../models/Notification.js';
import { Quiz } from '../models/Quiz.js';
import { QuizAttempt } from '../models/QuizAttempt.js';
import { SavedItem } from '../models/SavedItem.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { WebsiteChunk } from '../models/WebsiteChunk.js';
import { WebsiteSource } from '../models/WebsiteSource.js';

const byCreated = { createdAt: 1, _id: 1 };

export async function exportUserData(userId) {
  const ownerId = userId;
  const [user, documents, documentChunks, websiteSources, websiteChunks, conversations, messages, notes, folders, quizzes, quizAttempts, flashcardDecks, tasks, assignments, savedItems, notifications] = await Promise.all([
    User.findOne({ _id: ownerId, status: 'active' }).select('_id email displayName role createdAt updatedAt').lean(),
    Document.find({ ownerId }).select('-storageKey -contentHash').sort(byCreated).lean(),
    DocumentChunk.find({ ownerId }).sort({ documentId: 1, ordinal: 1 }).lean(),
    WebsiteSource.find({ ownerId }).select('-contentHash').sort(byCreated).lean(),
    WebsiteChunk.find({ ownerId }).sort({ sourceId: 1, ordinal: 1 }).lean(),
    Conversation.find({ ownerId }).sort(byCreated).lean(),
    Message.find({ ownerId }).sort(byCreated).lean(),
    Note.find({ ownerId }).sort(byCreated).lean(),
    Folder.find({ ownerId }).sort({ name: 1, _id: 1 }).lean(),
    Quiz.find({ ownerId }).sort(byCreated).lean(),
    QuizAttempt.find({ ownerId }).sort({ completedAt: 1, _id: 1 }).lean(),
    FlashcardDeck.find({ ownerId }).sort(byCreated).lean(),
    Task.find({ ownerId }).sort(byCreated).lean(),
    Assignment.find({ ownerId }).sort(byCreated).lean(),
    SavedItem.find({ ownerId }).sort(byCreated).lean(),
    Notification.find({ ownerId }).sort(byCreated).lean(),
  ]);

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    account: user ? { id: String(user._id), email: user.email, displayName: user.displayName, role: user.role, createdAt: user.createdAt, updatedAt: user.updatedAt } : null,
    data: { documents, documentChunks, websiteSources, websiteChunks, conversations, messages, notes, folders, quizzes, quizAttempts, flashcardDecks, tasks, assignments, savedItems, notifications },
    excluded: ['password credentials and sessions', 'local document binary files', 'internal storage keys and content hashes'],
  };
}
