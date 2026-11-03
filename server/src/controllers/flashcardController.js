import { deleteOwnedFlashcardDeck, generateOwnedFlashcardDeck, listOwnedFlashcardDecks } from '../services/flashcardService.js';

export async function listFlashcardDecksAction(req, res, next) {
  try { res.json(await listOwnedFlashcardDecks(req.user._id)); } catch (error) { next(error); }
}

export async function generateFlashcardsAction(req, res, next) {
  try { res.status(201).json(await generateOwnedFlashcardDeck(req.user._id, req.body)); } catch (error) { next(error); }
}

export async function deleteFlashcardDeckAction(req, res, next) {
  try { res.json(await deleteOwnedFlashcardDeck(req.user._id, req.params.id)); } catch (error) { next(error); }
}
