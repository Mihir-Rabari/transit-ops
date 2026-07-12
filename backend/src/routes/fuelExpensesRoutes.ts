import { Router } from 'express';
import {
  getAllFuelLogs,
  createFuelLog,
  getAllExpenses,
  createExpense
} from '../controllers/fuelExpensesController';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

router.get('/fuel-logs', getAllFuelLogs);
router.post('/fuel-logs', requireRole([Role.ADMIN, Role.FLEET_MANAGER, Role.DRIVER]), createFuelLog);

router.get('/expenses', getAllExpenses);
router.post('/expenses', requireRole([Role.ADMIN, Role.FLEET_MANAGER, Role.DRIVER]), createExpense);

export default router;
