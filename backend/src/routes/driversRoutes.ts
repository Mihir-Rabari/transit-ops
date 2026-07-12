import { Router } from 'express';
import {
  getAllDrivers,
  getAvailableDrivers,
  addDriver,
  updateDriver,
  getDriverDocuments,
  uploadDriverDocument
} from '../controllers/driversController';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';
import { upload } from '../utils/s3';

const router = Router();

// Apply authentication to all routes
router.use(authenticateJWT);

router.get('/', getAllDrivers);
router.get('/available', getAvailableDrivers);
router.post('/', requireRole([Role.ADMIN, Role.FLEET_MANAGER]), addDriver);
router.patch('/:id', requireRole([Role.ADMIN, Role.FLEET_MANAGER]), updateDriver);

// Driver documents (using S3 upload middleware)
router.get('/:id/documents', getDriverDocuments);
router.post('/:id/documents', requireRole([Role.ADMIN, Role.FLEET_MANAGER]), upload.single('file'), uploadDriverDocument);

export default router;
