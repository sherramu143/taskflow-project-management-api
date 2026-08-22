import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Rate limited authentication endpoints (10 req/min/IP)
router.post('/register', authRateLimiter, AuthController.register);
router.post('/login', authRateLimiter, AuthController.login);
router.post('/refresh', authRateLimiter, AuthController.refresh);
router.post('/logout', authRateLimiter, AuthController.logout);

// Authenticated session management
router.post('/logout-all', authenticateToken, AuthController.logoutAll);

export default router;
