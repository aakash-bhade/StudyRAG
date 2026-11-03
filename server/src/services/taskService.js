import mongoose from 'mongoose';
import { httpError } from '../middleware/errors.js';
import { Task } from '../models/Task.js';

function validId(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'INVALID_ID', 'The task ID is invalid.');
  return id;
}

function serialize(task) {
  return { id: String(task._id), title: task.title, details: task.details, dueAt: task.dueAt, status: task.status, createdAt: task.createdAt, updatedAt: task.updatedAt };
}

export async function listTasks(ownerId) {
  const tasks = await Task.find({ ownerId }).sort({ status: 1, dueAt: 1, updatedAt: -1 }).limit(200).lean();
  return tasks.map(serialize);
}

export async function createTask(ownerId, data) {
  return serialize(await Task.create({ ownerId, ...data }));
}

export async function updateTask(ownerId, id, data) {
  validId(id);
  const task = await Task.findOneAndUpdate({ _id: id, ownerId }, data, { returnDocument: 'after', runValidators: true });
  if (!task) throw httpError(404, 'TASK_NOT_FOUND', 'Task not found.');
  return serialize(task);
}

export async function deleteTask(ownerId, id) {
  validId(id);
  const task = await Task.findOneAndDelete({ _id: id, ownerId });
  if (!task) throw httpError(404, 'TASK_NOT_FOUND', 'Task not found.');
  return { success: true };
}
