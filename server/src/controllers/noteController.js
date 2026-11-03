import { createNote, deleteNote, listNotes, updateNote } from '../services/noteService.js';

export async function listNotesAction(req, res, next) {
  try { res.json({ items: await listNotes(req.user._id, req.validatedQuery.q) }); }
  catch (error) { next(error); }
}

export async function createNoteAction(req, res, next) {
  try { res.status(201).json({ item: await createNote(req.user._id, req.body) }); }
  catch (error) { next(error); }
}

export async function updateNoteAction(req, res, next) {
  try { res.json({ item: await updateNote(req.user._id, req.params.id, req.body) }); }
  catch (error) { next(error); }
}

export async function deleteNoteAction(req, res, next) {
  try { res.json(await deleteNote(req.user._id, req.params.id)); }
  catch (error) { next(error); }
}
