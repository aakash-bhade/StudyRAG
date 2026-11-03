import { Router } from 'express';
import { createTaskAction, deleteTaskAction, listTasksAction, updateTaskAction } from '../controllers/taskController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../validators/auth.js';
import { taskSchema } from '../validators/tasks.js';

const router = Router();
router.use(requireAuth);
router.get('/', listTasksAction);
router.post('/', validate(taskSchema), createTaskAction);
router.patch('/:id', validate(taskSchema), updateTaskAction);
router.delete('/:id', deleteTaskAction);
export default router;
