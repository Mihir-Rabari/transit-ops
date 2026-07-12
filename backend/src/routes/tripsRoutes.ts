import { Router } from 'express';
import {
  getAllTrips,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip
} from '../controllers/tripsController';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

router.get('/', getAllTrips);
router.post('/', requireRole([Role.FLEET_MANAGER]), createTrip);
router.patch('/:id/dispatch', requireRole([Role.FLEET_MANAGER, Role.DRIVER]), dispatchTrip);
router.patch('/:id/complete', requireRole([Role.FLEET_MANAGER, Role.DRIVER]), completeTrip);
router.patch('/:id/cancel', requireRole([Role.FLEET_MANAGER, Role.DRIVER]), cancelTrip);

export default router;
