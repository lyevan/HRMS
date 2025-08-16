import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '../generated/prisma/index.js';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: UserRole;
  };
}

export const verifyAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
  }
  next();
};

export const verifyStaff = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== UserRole.STAFF && req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({
      success: false,
      message: 'Staff or Admin access required',
    });
  }
  next();
};

export const verifyEmployee = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }
  next();
};
