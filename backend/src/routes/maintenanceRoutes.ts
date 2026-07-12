import { Router } from 'express';
import {
  getAllMaintenanceLogs,
  createMaintenanceLog,
  closeMaintenanceLog
} from '../controllers/maintenanceController';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

router.get('/', getAllMaintenanceLogs);
router.post('/', requireRole([Role.ADMIN, Role.FLEET_MANAGER, Role.SAFETY_OFFICER]), createMaintenanceLog);
router.patch('/:id/close', requireRole([Role.ADMIN, Role.FLEET_MANAGER, Role.SAFETY_OFFICER]), closeMaintenanceLog);

export default router;
