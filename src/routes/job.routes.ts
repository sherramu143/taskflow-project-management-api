import { Router } from 'express';
import { JobController } from '../controllers/job.controller';

const router = Router();

router.post('/process-pending', JobController.processPending);
router.get('/process-pending', JobController.processPending);
router.get('/:id', JobController.getStatus);

export default router;
