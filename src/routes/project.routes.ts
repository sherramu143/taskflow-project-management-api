import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { TaskController } from '../controllers/task.controller';
import { authenticateToken } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/rbacMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/', ProjectController.create);
router.get('/', ProjectController.list);
router.get('/:id', ProjectController.getById);
router.patch('/:id', ProjectController.update);
router.delete('/:id', requireAdmin, ProjectController.delete);
router.get('/:id/dashboard', ProjectController.getDashboard);

// Nested task creation under project
router.post('/:projectId/tasks', TaskController.create);

export default router;
