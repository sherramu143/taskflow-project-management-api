import { Router } from 'express';
import { JobController } from '../controllers/job.controller';

const router = Router();

router.get('/:id', JobController.getStatus);

export default router;

