import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/', TaskController.list);
router.patch('/bulk-status', TaskController.bulkStatus);
router.get('/:id', TaskController.getById);
router.patch('/:id', TaskController.update);
router.delete('/:id', TaskController.delete);

// Task Assignment & Unassignment
router.post('/:id/assign', TaskController.assign);
router.delete('/:id/assign/:userId', TaskController.unassign);

// Task Comments
router.post('/:id/comments', TaskController.addComment);
router.get('/:id/comments', TaskController.getComments);

export default router;
