import { Router } from 'express';
import {
  getAllDrivers,
  getAvailableDrivers,
  addDriver,
  updateDriver
} from '../controllers/driversController';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

router.get('/', getAllDrivers);
router.get('/available', getAvailableDrivers);
router.post('/', requireRole([Role.FLEET_MANAGER]), addDriver);
router.patch('/:id', requireRole([Role.FLEET_MANAGER]), updateDriver);

export default router;
