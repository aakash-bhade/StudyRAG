import mongoose from 'mongoose';
import { httpError } from '../middleware/errors.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { answerFromDocuments } from './chatService.js';

function validId(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'INVALID_ID', 'The conversation ID is invalid.');
  return id;
}

function serializeConversation(conversation) {
  return { id: String(conversation._id), title: conversation.title, sourceFilters: (conversation.sourceFilters || []).map(String), updatedAt: conversation.updatedAt, createdAt: conversation.createdAt };
}

function serializeMessage(message) {
  return {
    id: String(message._id), role: message.role, text: message.content,
    ...(message.role === 'assistant' ? { answer: message.answerMode === 'ollama' ? message.content : null, message: message.notice, answerMode: message.answerMode } : {}),
    sources: (message.citations || []).map(citation => ({ documentId: String(citation.documentId), documentName: citation.documentName, ordinal: citation.ordinal, page: citation.page, text: citation.excerpt })),
    createdAt: message.createdAt,
  };
}

export async function listConversations(userId) {
  const items = await Conversation.find({ ownerId: userId, archivedAt: null }).sort({ updatedAt: -1 }).limit(30).lean();
  return items.map(serializeConversation);
}

export async function getConversation(userId, id) {
  validId(id);
  const conversation = await Conversation.findOne({ _id: id, ownerId: userId, archivedAt: null }).lean();
  if (!conversation) throw httpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  const messages = (await Message.find({ ownerId: userId, conversationId: conversation._id }).sort({ createdAt: -1 }).limit(200).lean()).reverse();
  return { ...serializeConversation(conversation), messages: messages.map(serializeMessage) };
}

export async function deleteConversation(userId, id) {
  validId(id);
  const conversation = await Conversation.findOneAndDelete({ _id: id, ownerId: userId });
  if (!conversation) throw httpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
  await Message.deleteMany({ ownerId: userId, conversationId: conversation._id });
  return { success: true };
}

export async function askInConversation(userId, { question, documentIds, conversationId }) {
  let conversation;
  if (conversationId) {
    validId(conversationId);
    conversation = await Conversation.findOne({ _id: conversationId, ownerId: userId, archivedAt: null });
    if (!conversation) throw httpError(404, 'CONVERSATION_NOT_FOUND', 'Conversation not found.');
    if (documentIds === undefined) documentIds = conversation.sourceFilters.map(String);
    else conversation.sourceFilters = documentIds;
  } else {
    conversation = new Conversation({ ownerId: userId, title: question.slice(0, 116).trim() + (question.length > 116 ? '…' : ''), sourceFilters: documentIds || [] });
  }

  const result = await answerFromDocuments(userId, { question, documentIds });
  const wasNew = conversation.isNew;
  await conversation.save();
  let created;
  try {
    created = await Message.insertMany([
    { ownerId: userId, conversationId: conversation._id, role: 'user', content: question },
    {
      ownerId: userId, conversationId: conversation._id, role: 'assistant',
      content: result.answer || result.message || 'No relevant material was found.',
      notice: result.message || undefined,
      citations: result.sources.map(source => ({ documentId: source.documentId, documentName: source.documentName, ordinal: source.ordinal, page: source.page, excerpt: source.text })),
      answerMode: result.answerMode,
    },
    ], { ordered: true });
  } catch (error) {
    if (wasNew) await Conversation.deleteOne({ _id: conversation._id, ownerId: userId });
    throw error;
  }
  return { conversation: serializeConversation(conversation), item: result, messages: created.map(serializeMessage) };
}
