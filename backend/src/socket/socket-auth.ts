import { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt-utils';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: 'manager' | 'employee';
  userEmail?: string;
  userPhone?: string;
}

export const socketAuth = (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
): void => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = verifyToken(token);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    socket.userEmail = decoded.email;
    socket.userPhone = decoded.phoneNumber;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};
