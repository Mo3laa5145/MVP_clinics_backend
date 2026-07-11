import { Router } from 'express';
import aiController from '../controllers/ai.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/chat', authenticate, authorize(['ADMIN', 'DOCTOR']), aiController.chat);

export default router;
