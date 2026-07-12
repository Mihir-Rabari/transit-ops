import { Router } from 'express';
import authRoutes from './authRoutes';
import vehiclesRoutes from './vehiclesRoutes';
import driversRoutes from './driversRoutes';
import tripsRoutes from './tripsRoutes';
import maintenanceRoutes from './maintenanceRoutes';
import fuelExpensesRoutes from './fuelExpensesRoutes';
import dashboardRoutes from './dashboardRoutes';
import reportsRoutes from './reportsRoutes';
import usersRoutes from './usersRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vehicles', vehiclesRoutes);
router.use('/drivers', driversRoutes);
router.use('/trips', tripsRoutes);
router.use('/maintenance', maintenanceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportsRoutes);
router.use('/users', usersRoutes);

// Fuel & Expense routes are at the root API path (/fuel-logs and /expenses)
router.use('/', fuelExpensesRoutes);

export default router;
