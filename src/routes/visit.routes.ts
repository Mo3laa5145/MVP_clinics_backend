import { Router } from 'express';
import visitController from '../controllers/visit.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, authorize(['ADMIN', 'DOCTOR']), visitController.create);
router.put('/:id', authenticate, authorize(['ADMIN', 'DOCTOR']), visitController.update);
router.delete('/:id', authenticate, authorize(['ADMIN']), visitController.delete);
router.get('/patient/:patientId/history', authenticate, visitController.history);

export default router;
