import { Router } from 'express';
import {
  getAllTrips,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getTripDocuments,
  uploadTripDocument
} from '../controllers/tripsController';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { upload } from '../utils/s3';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

router.get('/', getAllTrips);
router.post('/', requireRole([Role.ADMIN, Role.FLEET_MANAGER]), createTrip);
router.patch('/:id/dispatch', requireRole([Role.ADMIN, Role.FLEET_MANAGER, Role.DRIVER]), dispatchTrip);
router.patch('/:id/complete', requireRole([Role.ADMIN, Role.FLEET_MANAGER, Role.DRIVER]), completeTrip);
router.patch('/:id/cancel', requireRole([Role.ADMIN, Role.FLEET_MANAGER, Role.DRIVER]), cancelTrip);

// Trip documents (S3 upload)
router.get('/:id/documents', getTripDocuments);
router.post('/:id/documents', requireRole([Role.ADMIN, Role.FLEET_MANAGER, Role.DRIVER]), upload.single('file'), uploadTripDocument);

export default router;
