import { Router } from 'express';
import { getDashboardKPIs } from '../controllers/dashboardController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Apply authentication
router.use(authenticateJWT);

router.get('/kpis', getDashboardKPIs);

export default router;
