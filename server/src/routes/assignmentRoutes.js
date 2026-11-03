import { Router } from 'express';
import { createAssignmentAction, deleteAssignmentAction, listAssignmentsAction, submitAssignmentAction, updateAssignmentAction } from '../controllers/assignmentController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../validators/auth.js';
import { assignmentSchema, submissionSchema } from '../validators/assignments.js';

const router = Router();
router.use(requireAuth);
router.get('/', listAssignmentsAction);
router.post('/', validate(assignmentSchema), createAssignmentAction);
router.patch('/:id', validate(assignmentSchema), updateAssignmentAction);
router.post('/:id/submit', validate(submissionSchema), submitAssignmentAction);
router.delete('/:id', deleteAssignmentAction);
export default router;
