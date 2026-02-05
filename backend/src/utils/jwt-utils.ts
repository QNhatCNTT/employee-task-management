import jwt from 'jsonwebtoken';
import { UserPayload } from '../types/api-types';
import { envConfig } from '../config/env-config';

const JWT_EXPIRY = '24h';

export const generateToken = (payload: UserPayload): string => {
  return jwt.sign(payload, envConfig.JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, envConfig.JWT_SECRET) as UserPayload;
};
