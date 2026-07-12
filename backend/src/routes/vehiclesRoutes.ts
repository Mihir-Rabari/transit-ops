import { Router } from 'express';
import {
  getAllVehicles,
  getAvailableVehicles,
  registerVehicle,
  updateVehicle,
  getVehicleDocuments,
  uploadVehicleDocument
} from '../controllers/vehiclesController';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

router.get('/', getAllVehicles);
router.get('/available', getAvailableVehicles);
router.post('/', requireRole([Role.FLEET_MANAGER]), registerVehicle);
router.patch('/:id', requireRole([Role.FLEET_MANAGER]), updateVehicle);

// Document routes
router.get('/:id/documents', getVehicleDocuments);
router.post('/:id/documents', requireRole([Role.FLEET_MANAGER]), uploadVehicleDocument);

export default router;
