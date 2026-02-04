import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express-types.js';
import { verifyToken } from '../utils/jwt-utils.js';
import { sendError } from '../utils/response-utils.js';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'No token provided', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
};

export const managerOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.userRole !== 'manager') {
    sendError(res, 'Manager access required', 403);
    return;
  }
  next();
};
