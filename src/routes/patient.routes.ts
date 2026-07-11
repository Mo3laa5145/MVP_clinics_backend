import { Router } from 'express';
import patientController from '../controllers/patient.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, patientController.list);
router.get('/search', authenticate, patientController.search);
router.get('/:id/history', authenticate, patientController.getHistory);
router.get('/:id', authenticate, patientController.getById);
router.post('/', authenticate, patientController.create);
router.put('/:id', authenticate, patientController.update);
router.delete('/:id', authenticate, authorize(['ADMIN']), patientController.delete);

export default router;
