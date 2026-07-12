import { Router } from 'express';
import { register, login, refresh, logout } from '../controllers/authController';
import { authenticateJWT } from '../middlewares/auth';
import { loginRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/register', register);
router.post('/login', loginRateLimiter, login);
router.post('/refresh', refresh);
router.post('/logout', authenticateJWT, logout);

export default router;
