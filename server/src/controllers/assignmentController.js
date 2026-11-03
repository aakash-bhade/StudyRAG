import { createAssignment, deleteAssignment, listAssignments, submitAssignment, updateAssignment } from '../services/assignmentService.js';

export async function listAssignmentsAction(req, res, next) {
  try { res.json({ items: await listAssignments(req.user._id) }); } catch (error) { next(error); }
}
export async function createAssignmentAction(req, res, next) {
  try { res.status(201).json({ item: await createAssignment(req.user._id, req.body) }); } catch (error) { next(error); }
}
export async function updateAssignmentAction(req, res, next) {
  try { res.json({ item: await updateAssignment(req.user._id, req.params.id, req.body) }); } catch (error) { next(error); }
}
export async function submitAssignmentAction(req, res, next) {
  try { res.json({ item: await submitAssignment(req.user._id, req.params.id, req.body.response) }); } catch (error) { next(error); }
}
export async function deleteAssignmentAction(req, res, next) {
  try { res.json(await deleteAssignment(req.user._id, req.params.id)); } catch (error) { next(error); }
}
