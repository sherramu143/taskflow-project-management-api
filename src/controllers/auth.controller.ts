import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from '../utils/validators';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = registerSchema.parse(req.body);
      const result = await AuthService.register(validated);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);
      const result = await AuthService.login(validated);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = refreshTokenSchema.parse(req.body);
      const result = await AuthService.refresh(validated.refreshToken);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = refreshTokenSchema.parse(req.body);
      await AuthService.logout(validated.refreshToken);
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async logoutAll(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user?.id) {
        await AuthService.logoutAll(req.user.id);
      }
      res.status(200).json({ message: 'Logged out from all devices successfully' });
    } catch (error) {
      next(error);
    }
  }
}
