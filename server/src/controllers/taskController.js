import { createTask, deleteTask, listTasks, updateTask } from '../services/taskService.js';

export async function listTasksAction(req, res, next) {
  try { res.json({ items: await listTasks(req.user._id) }); } catch (error) { next(error); }
}
export async function createTaskAction(req, res, next) {
  try { res.status(201).json({ item: await createTask(req.user._id, req.body) }); } catch (error) { next(error); }
}
export async function updateTaskAction(req, res, next) {
  try { res.json({ item: await updateTask(req.user._id, req.params.id, req.body) }); } catch (error) { next(error); }
}
export async function deleteTaskAction(req, res, next) {
  try { res.json(await deleteTask(req.user._id, req.params.id)); } catch (error) { next(error); }
}
