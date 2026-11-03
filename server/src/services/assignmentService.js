import mongoose from 'mongoose';
import { httpError } from '../middleware/errors.js';
import { Assignment } from '../models/Assignment.js';

function validId(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'INVALID_ID', 'The assignment ID is invalid.');
  return id;
}
function serialize(item) {
  return { id: String(item._id), title: item.title, instructions: item.instructions, dueAt: item.dueAt, status: item.status, response: item.response, submittedAt: item.submittedAt, createdAt: item.createdAt, updatedAt: item.updatedAt };
}
export async function listAssignments(ownerId) {
  return (await Assignment.find({ ownerId }).sort({ status: 1, dueAt: 1, updatedAt: -1 }).limit(200).lean()).map(serialize);
}
export async function createAssignment(ownerId, data) {
  return serialize(await Assignment.create({ ownerId, ...data }));
}
export async function updateAssignment(ownerId, id, data) {
  validId(id);
  const item = await Assignment.findOneAndUpdate({ _id: id, ownerId, status: { $ne: 'submitted' } }, data, { new: true, runValidators: true });
  if (!item) {
    if (await Assignment.exists({ _id: id, ownerId })) throw httpError(409, 'ASSIGNMENT_SUBMITTED', 'Submitted assignments are locked.');
    throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found.');
  }
  return serialize(item);
}
export async function submitAssignment(ownerId, id, response) {
  validId(id);
  const item = await Assignment.findOneAndUpdate({ _id: id, ownerId }, { $set: { response, status: 'submitted', submittedAt: new Date() } }, { new: true, runValidators: true });
  if (!item) throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found.');
  return serialize(item);
}
export async function deleteAssignment(ownerId, id) {
  validId(id);
  const item = await Assignment.findOneAndDelete({ _id: id, ownerId });
  if (!item) throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found.');
  return { success: true };
}
