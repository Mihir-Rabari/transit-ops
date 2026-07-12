import { Router } from 'express';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/usersController';
import { authenticateJWT, requireRole } from '../middlewares/auth';
import { Role } from '@prisma/client';

const router = Router();

// Apply JWT authentication and strictly restrict to ADMIN
router.use(authenticateJWT);
router.use(requireRole([Role.ADMIN]));

router.get('/', getAllUsers);
router.post('/', createUser);
router.patch('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
