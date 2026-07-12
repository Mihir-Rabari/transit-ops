import { Router } from 'express';
import {
  getFuelEfficiencyReport,
  getUtilizationReport,
  getROIReport,
  exportCSVReport
} from '../controllers/reportsController';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

router.get('/fuel-efficiency', requireRole([Role.FLEET_MANAGER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST]), getFuelEfficiencyReport);
router.get('/utilization', requireRole([Role.FLEET_MANAGER, Role.SAFETY_OFFICER, Role.FINANCIAL_ANALYST]), getUtilizationReport);
router.get('/roi', requireRole([Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST]), getROIReport);
router.get('/export.csv', requireRole([Role.FLEET_MANAGER, Role.FINANCIAL_ANALYST]), exportCSVReport);

export default router;
